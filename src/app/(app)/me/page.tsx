import { UserRound } from "lucide-react";
import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { Skeleton } from "@/components/ui/core";
import { PageHeader } from "@/components/PageHeader";
import { getProfile, type Profile, ProfileIdentityForm, ProfilePhotoEditor } from "@/features/profile";

export const metadata: Metadata = { title: "Moi" };

export default function MePage() {
  return (
    <main className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-6 md:px-6">
        <PageHeader
          title="Moi"
          description="Tes informations professionnelles : elles servent à générer ton CV."
          icon={<UserRound />}
        />
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <ProfileContent />
        </Suspense>
      </div>
    </main>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-neutral-6 p-4 md:p-6">
      <div>
        <h2 className="text-base font-semibold text-neutral-12">{title}</h2>
        {description && <p className="text-sm text-neutral-11">{description}</p>}
      </div>
      {children}
    </section>
  );
}

async function ProfileContent() {
  let profile: Profile;
  try {
    profile = await getProfile();
  } catch (error) {
    unstable_rethrow(error);
    return (
      <p role="alert" className="text-sm text-danger-11">
        Impossible de charger ton profil. Recharge la page.
      </p>
    );
  }

  return (
    <Section title="Identité" description="Enregistré automatiquement à la sortie de chaque champ.">
      <ProfilePhotoEditor hasPhoto={Boolean(profile.photo_path)} version={profile.updated_at} fullName={profile.full_name} />
      <ProfileIdentityForm profile={profile} />
    </Section>
  );
}
