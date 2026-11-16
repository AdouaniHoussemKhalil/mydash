import type { ReactNode } from "react";
import { cn } from "@quickadui/utils";
import { type Entries, formatMonth, formatPeriod, SKILL_LEVEL_LABELS, SKILL_LEVEL_SCORE, type SkillLevel } from "../entries";
import { initials, type Profile } from "../schemas";
import { CvRichText } from "./CvRichText";

/** Lien affiché sans « https:// » ni « www. » : « linkedin.com/in/moi ». */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

export function Heading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2 border-b border-accent-7 pb-1 text-[0.8rem] font-semibold tracking-[0.12em] text-accent-11 uppercase">
      {children}
    </h2>
  );
}

export function Block({ children, className }: { children: ReactNode; className?: string }) {
  // Une entrée n'est jamais coupée entre deux pages.
  return <div className={cn("break-inside-avoid", className)}>{children}</div>;
}

/** Jauge de niveau (4 cases), imprimée en couleur. */
export function Gauge({ level }: { level: SkillLevel }) {
  const score = SKILL_LEVEL_SCORE[level];
  return (
    <span className="flex gap-0.5" role="img" aria-label={SKILL_LEVEL_LABELS[level]} title={SKILL_LEVEL_LABELS[level]}>
      {[1, 2, 3, 4].map((step) => (
        <span key={step} className={cn("h-1.5 w-3.5 rounded-full", step <= score ? "bg-accent-9" : "bg-accent-4")} />
      ))}
    </span>
  );
}

export type CvDocumentProps = {
  profile: Profile;
  /** Entrées déjà filtrées (« afficher sur le CV »). */
  entries: Entries;
  hasPhoto: boolean;
};

/**
 * CV au format A4 : en-tête (photo, identité, contact), colonne latérale
 * (compétences, langues, certifications) et colonne principale (profil,
 * expériences, formations, projets). Les sections vides sont masquées.
 */
export function CvDocument({ profile, entries, hasPhoto }: CvDocumentProps) {
  const contacts = [profile.contact_email, profile.phone, profile.location].filter(Boolean) as string[];
  const links = [profile.linkedin, profile.github, profile.website].filter(Boolean) as string[];
  const skillGroups = [...new Set(entries.skills.map((skill) => skill.category || "Autres"))].map((category) => ({
    category,
    skills: entries.skills.filter((skill) => (skill.category || "Autres") === category),
  }));
  const hasSide = entries.skills.length + entries.languages.length + entries.certifications.length > 0;

  return (
    <article className="cv-sheet mx-auto flex w-[210mm] min-h-[297mm] flex-col gap-6 bg-neutral-1 p-[14mm] text-[0.82rem] leading-relaxed text-neutral-12 shadow-lg print:shadow-none">
      <header className="flex items-center gap-5">
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL signée courte (route /api/profile/photo)
          <img src="/api/profile/photo" alt="" className="size-[28mm] shrink-0 rounded-full object-cover" />
        ) : (
          <div aria-hidden className="flex size-[24mm] shrink-0 items-center justify-center rounded-full bg-accent-3 text-2xl font-semibold text-accent-11">
            {initials(profile.full_name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-[1.7rem] leading-tight font-bold text-neutral-12">{profile.full_name || "Ton nom"}</h1>
          {profile.headline && <p className="text-base font-medium text-accent-11">{profile.headline}</p>}
          {contacts.length > 0 && <p className="mt-1 text-neutral-11">{contacts.join(" · ")}</p>}
          {links.length > 0 && (
            <p className="text-neutral-11">
              {links.map((link, index) => (
                <span key={link}>
                  {index > 0 && " · "}
                  <a href={link} className="hover:underline">
                    {displayUrl(link)}
                  </a>
                </span>
              ))}
            </p>
          )}
        </div>
      </header>

      <div className={cn("grid gap-7", hasSide && "grid-cols-[1fr_2.1fr]")}>
        {hasSide && (
          <aside className="flex flex-col gap-5">
            {entries.skills.length > 0 && (
              <section>
                <Heading>Compétences</Heading>
                <div className="flex flex-col gap-3">
                  {skillGroups.map((group) => (
                    <Block key={group.category}>
                      {skillGroups.length > 1 && <p className="mb-1 font-semibold text-neutral-12">{group.category}</p>}
                      <ul className="flex flex-col gap-1">
                        {group.skills.map((skill) => (
                          <li key={skill.id} className="flex items-center justify-between gap-2">
                            <span>{skill.name}</span>
                            <Gauge level={skill.level as SkillLevel} />
                          </li>
                        ))}
                      </ul>
                    </Block>
                  ))}
                </div>
              </section>
            )}
            {entries.languages.length > 0 && (
              <section>
                <Heading>Langues</Heading>
                <ul className="flex flex-col gap-0.5">
                  {entries.languages.map((language) => (
                    <li key={language.id} className="flex justify-between gap-2">
                      <span>{language.name}</span>
                      <span className="text-neutral-11">{language.level}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {entries.certifications.length > 0 && (
              <section>
                <Heading>Certifications</Heading>
                <ul className="flex flex-col gap-2">
                  {entries.certifications.map((certification) => (
                    <Block key={certification.id}>
                      <p className="font-semibold">
                        {certification.url ? <a href={certification.url}>{certification.name}</a> : certification.name}
                      </p>
                      <p className="text-neutral-11">
                        {[certification.issuer, certification.issued_on && formatMonth(certification.issued_on)].filter(Boolean).join(" · ")}
                      </p>
                    </Block>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        )}

        <div className="flex flex-col gap-5">
          {profile.summary && (
            <section>
              <Heading>Profil</Heading>
              <CvRichText text={profile.summary} />
            </section>
          )}
          {entries.experiences.length > 0 && (
            <section>
              <Heading>Expériences</Heading>
              <div className="flex flex-col gap-3">
                {entries.experiences.map((experience) => (
                  <Block key={experience.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="font-semibold">
                        {experience.title}
                        {experience.organization && <span className="font-normal text-accent-11"> · {experience.organization}</span>}
                      </p>
                      <p className="text-[0.75rem] text-neutral-11">{formatPeriod(experience.start_date, experience.end_date)}</p>
                    </div>
                    {experience.location && <p className="text-[0.75rem] text-neutral-11">{experience.location}</p>}
                    {experience.description && <CvRichText text={experience.description} className="mt-0.5" />}
                  </Block>
                ))}
              </div>
            </section>
          )}
          {entries.education.length > 0 && (
            <section>
              <Heading>Formations</Heading>
              <div className="flex flex-col gap-3">
                {entries.education.map((education) => (
                  <Block key={education.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="font-semibold">
                        {education.degree}
                        {education.school && <span className="font-normal text-accent-11"> · {education.school}</span>}
                      </p>
                      <p className="text-[0.75rem] text-neutral-11">{formatPeriod(education.start_date, education.end_date, "en cours")}</p>
                    </div>
                    {education.location && <p className="text-[0.75rem] text-neutral-11">{education.location}</p>}
                    {education.description && <CvRichText text={education.description} className="mt-0.5" />}
                  </Block>
                ))}
              </div>
            </section>
          )}
          {entries.projects.length > 0 && (
            <section>
              <Heading>Projets</Heading>
              <div className="flex flex-col gap-3">
                {entries.projects.map((project) => (
                  <Block key={project.id}>
                    <p className="font-semibold">
                      {project.name}
                      {project.url && (
                        <a href={project.url} className="ml-2 text-[0.75rem] font-normal text-neutral-11">
                          {displayUrl(project.url)}
                        </a>
                      )}
                    </p>
                    {project.description && <CvRichText text={project.description} />}
                  </Block>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </article>
  );
}

/** Ne garde que les entrées à afficher sur le CV. */
export function cvEntries(entries: Entries): Entries {
  return {
    skills: entries.skills.filter((entry) => entry.show_on_cv),
    experiences: entries.experiences.filter((entry) => entry.show_on_cv),
    education: entries.education.filter((entry) => entry.show_on_cv),
    languages: entries.languages.filter((entry) => entry.show_on_cv),
    projects: entries.projects.filter((entry) => entry.show_on_cv),
    certifications: entries.certifications.filter((entry) => entry.show_on_cv),
  };
}
