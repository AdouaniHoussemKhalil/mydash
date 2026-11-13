// Côté serveur uniquement (node:http/https) : ne jamais importer depuis un Client Component.
import { lookup, type LookupAddress } from "node:dns";
import http, { type IncomingMessage } from "node:http";
import https from "node:https";
import net from "node:net";
import zlib from "node:zlib";
import type { Readable } from "node:stream";
import { detectCharset, type LinkPreview, parseHtmlPreview } from "./parse";

const TIMEOUT_MS = 5_000;
const MAX_BYTES = 512 * 1024;
const MAX_REDIRECTS = 3;
const ALLOWED_PORTS = new Set(["", "80", "443", "8080", "8443"]);

export class PreviewError extends Error {}

// ─────────────── Garde-fous réseau (SSRF) ───────────────

const blocked = new net.BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
  ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16],
  ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) {
  blocked.addSubnet(network, prefix, "ipv4");
}
for (const [network, prefix] of [
  ["::", 128], ["::1", 128], ["64:ff9b:1::", 48], ["100::", 64], ["2001::", 23],
  ["2001:db8::", 32], ["2002::", 16], ["fc00::", 7], ["fe80::", 10], ["fec0::", 10], ["ff00::", 8],
] as const) {
  blocked.addSubnet(network, prefix, "ipv6");
}

/** Les 8 groupes de 16 bits d'une adresse IPv6 (forme « :: » ou IPv4 finale acceptées). */
function ipv6Groups(address: string): number[] | null {
  let text = address.toLowerCase();
  const tail = /(\d+\.\d+\.\d+\.\d+)$/.exec(text)?.[1];
  if (tail) {
    const [a = 0, b = 0, c = 0, d = 0] = tail.split(".").map(Number);
    text = `${text.slice(0, -tail.length)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const [head = "", rest] = text.split("::");
  const left = head ? head.split(":") : [];
  const right = rest ? rest.split(":") : [];
  const missing = 8 - left.length - right.length;
  if (rest === undefined ? left.length !== 8 : missing < 1) return null;
  const groups = [...left, ...Array<string>(rest === undefined ? 0 : missing).fill("0"), ...right].map((g) => parseInt(g, 16));
  return groups.every((g) => Number.isInteger(g) && g >= 0 && g <= 0xffff) ? groups : null;
}

/** Adresse joignable publiquement (ni locale, ni privée, ni réservée). */
export function isPublicAddress(address: string): boolean {
  const version = net.isIP(address);
  if (version === 4) return !blocked.check(address, "ipv4");
  if (version !== 6) return false;
  const groups = ipv6Groups(address);
  if (!groups) return false;
  const embeddedV4 = `${groups[6]! >> 8}.${groups[6]! & 0xff}.${groups[7]! >> 8}.${groups[7]! & 0xff}`;
  const prefix = groups.slice(0, 6);
  // IPv4 encapsulée (::ffff:a.b.c.d) ou traduite par NAT64 (64:ff9b::/96) :
  // juger l'adresse IPv4 réellement visée.
  if (prefix.join(":") === "0:0:0:0:0:65535") return isPublicAddress(embeddedV4);
  if (prefix.join(":") === "100:65435:0:0:0:0") return isPublicAddress(embeddedV4);
  return !blocked.check(address, "ipv6");
}

/**
 * Résolution DNS vérifiée au moment de la connexion : l'adresse réellement
 * contactée est contrôlée (pas de contournement par rebinding DNS).
 */
function safeLookup(
  hostname: string,
  options: { all?: boolean; family?: number | string },
  callback: (error: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void,
) {
  lookup(hostname, { all: true }, (error, addresses) => {
    if (error) return callback(error, []);
    // Seules les adresses publiques sont transmises à la connexion.
    const allowed = addresses.filter(({ address }) => isPublicAddress(address));
    if (allowed.length === 0) {
      return callback(Object.assign(new Error("Adresse non autorisée"), { code: "EBLOCKED" }), []);
    }
    if (options.all) return callback(null, allowed);
    const [first] = allowed as [LookupAddress];
    callback(null, first.address, first.family);
  });
}

function assertAllowedUrl(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new PreviewError("Protocole non pris en charge");
  if (url.username || url.password) throw new PreviewError("URL avec identifiants refusée");
  if (!ALLOWED_PORTS.has(url.port)) throw new PreviewError("Port non autorisé");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(host) && !isPublicAddress(host)) throw new PreviewError("Adresse non autorisée");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new PreviewError("Adresse non autorisée");
  }
}

// ─────────────── Requête ───────────────

function request(url: URL, signal: AbortSignal): Promise<IncomingMessage> {
  const client = url.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = client.request(
      url,
      {
        method: "GET",
        lookup: safeLookup as unknown as typeof lookup,
        signal,
        headers: {
          "user-agent": "Mozilla/5.0 (compatible; MyDashPreview/1.0)",
          accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
          "accept-language": "fr,en;q=0.8",
          "accept-encoding": "gzip, deflate, br",
        },
      },
      resolve,
    );
    req.on("error", reject);
    req.end();
  });
}

function decompress(response: IncomingMessage): Readable {
  switch (response.headers["content-encoding"]?.toLowerCase()) {
    case "gzip":
      return response.pipe(zlib.createGunzip());
    case "deflate":
      return response.pipe(zlib.createInflate());
    case "br":
      return response.pipe(zlib.createBrotliDecompress());
    default:
      return response;
  }
}

/** Lit au plus MAX_BYTES, et s'arrête dès la fin du <head>. */
async function readHead(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of stream) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string);
    chunks.push(buffer);
    size += buffer.length;
    if (size >= MAX_BYTES || /<\/head\s*>/i.test(buffer.toString("latin1"))) break;
  }
  stream.destroy();
  return Buffer.concat(chunks).subarray(0, MAX_BYTES);
}

function decode(bytes: Buffer, contentType: string | null): string {
  const charset = detectCharset(contentType, bytes.subarray(0, 2048).toString("latin1"));
  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

/**
 * Récupère l'aperçu d'une page publique : http(s) seulement, adresses
 * privées refusées (y compris après redirection), 5 s et 512 Ko maximum.
 */
export async function fetchLinkPreview(href: string): Promise<LinkPreview> {
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    throw new PreviewError("URL invalide");
  }

  try {
    for (let redirects = 0; ; redirects++) {
      assertAllowedUrl(url);
      const response = await request(url, signal);
      const status = response.statusCode ?? 0;

      if (status >= 300 && status < 400 && response.headers.location) {
        response.resume();
        if (redirects >= MAX_REDIRECTS) throw new PreviewError("Trop de redirections");
        url = new URL(response.headers.location, url);
        continue;
      }
      if (status >= 400) {
        response.resume();
        throw new PreviewError(`La page répond ${status}`);
      }

      const contentType = response.headers["content-type"] ?? null;
      if (!/text\/html|application\/xhtml\+xml/i.test(contentType ?? "")) {
        response.destroy();
        // Pas une page HTML (image, PDF…) : seul le favicon du site.
        return parseHtmlPreview("", url.toString());
      }
      const html = decode(await readHead(decompress(response)), contentType);
      return parseHtmlPreview(html, url.toString());
    }
  } catch (error) {
    if (error instanceof PreviewError) throw error;
    if (signal.aborted) throw new PreviewError("La page met trop de temps à répondre");
    if ((error as NodeJS.ErrnoException).code === "EBLOCKED") throw new PreviewError("Adresse non autorisée");
    throw new PreviewError("Page injoignable");
  }
}
