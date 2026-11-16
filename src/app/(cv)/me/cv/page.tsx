import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/core";
import { PageHeader } from "@/components/PageHeader";
import { CvChooser, ForceLightTheme, getProfile, isCvTemplate, type Profile } from "@/features/profile";

export const metadata: Metadata = { title: "Créer mon CV" };

/** Choix du modèle et de la couleur, avant de générer le CV. */
export default function CvChoicePage() {
  return (
    <>
      <ForceLightTheme />
      <div className="border-b border-neutral-6 bg-neutral-1 px-4 py-3">
        <Link href="/me" className="inline-flex items-center gap-1.5 text-sm text-neutral-11 hover:text-neutral-12">
          <ArrowLeft className="size-4" aria-hidden />
          Retour à Moi
        </Link>
      </div>
      <main className="flex flex-col gap-6 px-4 py-8">
        <div className="mx-auto w-full max-w-3xl">
          <PageHeader title="Créer mon CV" description="Choisis un modèle et une couleur ; ton choix est retenu pour la prochaine fois." />
        </div>
        <Suspense fallback={<Skeleton className="mx-auto h-96 w-full max-w-3xl" />}>
          <Chooser />
        </Suspense>
      </main>
    </>
  );
}

async function Chooser() {
  let profile: Profile;
  try {
    profile = await getProfile();
  } catch (error) {
    unstable_rethrow(error);
    return (
      <p role="alert" className="text-center text-sm text-danger-11">
        Impossible de charger ton profil. Recharge la page.
      </p>
    );
  }
  return <CvChooser initialTemplate={isCvTemplate(profile.cv_template) ? profile.cv_template : "sobre"} initialColor={profile.cv_color} />;
}
