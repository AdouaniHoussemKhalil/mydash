import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeScript } from "@/components/ui/theme";
import { THEME_STORAGE_KEY } from "@/lib/constants";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "MyDash", template: "%s · MyDash" },
  description: "Liens, notes, docs, repos, outils, prompts et calendrier au même endroit.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme est posé par ThemeScript avant l'hydratation
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript storageKey={THEME_STORAGE_KEY} />
      </head>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
