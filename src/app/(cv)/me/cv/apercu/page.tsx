import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/core";
import { CvColorScope, CvColumns, cvEntries, CvDocument, ForceLightTheme, getProfile, listEntries, PrintButton } from "@/features/profile";

export const metadata: Metadata = { title: "Mon CV" };

export default function CvPage() {
  return (
    <>
      <ForceLightTheme />
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-neutral-6 bg-neutral-1 px-4 py-3 print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/me" className="inline-flex items-center gap-1.5 text-sm text-neutral-11 hover:text-neutral-12">
            <ArrowLeft className="size-4" aria-hidden />
            Retour à Moi
          </Link>
          <Link href="/me/cv" className="text-sm text-accent-11 hover:underline">
            Changer de modèle
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <p className="hidden text-xs text-neutral-11 sm:block">Dans la fenêtre d&apos;impression : « Enregistrer au format PDF ».</p>
          <PrintButton />
        </div>
      </div>
      <div className="overflow-x-auto px-4 py-8 print:p-0">
        <Suspense fallback={<Skeleton className="mx-auto h-[297mm] w-[210mm]" />}>
          <Cv />
        </Suspense>
      </div>
    </>
  );
}

async function Cv() {
  let data: [Awaited<ReturnType<typeof getProfile>>, Awaited<ReturnType<typeof listEntries>>];
  try {
    data = await Promise.all([getProfile(), listEntries()]);
  } catch (error) {
    unstable_rethrow(error);
    return (
      <p role="alert" className="text-center text-sm text-danger-11">
        Impossible de générer le CV. Recharge la page.
      </p>
    );
  }
  const [profile, entries] = data;
  const props = { profile, entries: cvEntries(entries), hasPhoto: Boolean(profile.photo_path) };
  return (
    <CvColorScope color={profile.cv_color}>
      {profile.cv_template === "colonnes" ? <CvColumns {...props} /> : <CvDocument {...props} />}
    </CvColorScope>
  );
}
