import { Award, BookOpen, Briefcase, CircleUserRound, Globe, Languages, Mail, MapPin, Phone, Sparkles, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@quickadui/utils";
import { type Entries, formatMonth, formatPeriod, SKILL_LEVEL_LABELS, SKILL_LEVEL_SCORE, type SkillLevel } from "../entries";
import { initials, isDarkColor, type Profile } from "../schemas";
import { displayUrl } from "./CvDocument";
import { CvRichText } from "./CvRichText";

/** Barre de niveau (sur 4), imprimée en couleur. */
function Bar({ level, tone = "light" }: { level: SkillLevel; tone?: "light" | "dark" }) {
  return (
    <div
      role="img"
      aria-label={SKILL_LEVEL_LABELS[level]}
      className={cn("h-1.5 w-full overflow-hidden", tone === "dark" ? "bg-neutral-9" : "bg-neutral-3")}
    >
      <div className="h-full bg-accent-9" style={{ width: `${SKILL_LEVEL_SCORE[level] * 25}%` }} />
    </div>
  );
}

/** Titre de section de la colonne droite : icône ronde + titre + filet. */
function MainHeading({ icon, children }: { icon: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3 border-b-2 border-neutral-11 pb-1.5">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-9 text-neutral-1 [&_svg]:size-4">{icon}</span>
      {children && <h2 className="text-[1.05rem] font-extrabold tracking-wide text-neutral-11 uppercase">{children}</h2>}
    </div>
  );
}

/** Titre de section de la colonne gauche (sur fond foncé). */
function SideHeading({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3 border-b-2 border-neutral-1 pb-1.5">
      <span className="text-accent-9 [&_svg]:size-5">{icon}</span>
      <h2 className="text-[1.05rem] font-extrabold tracking-wide uppercase">{children}</h2>
    </div>
  );
}

function SideLine({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 break-inside-avoid">
      <span className="mt-0.5 text-neutral-1 [&_svg]:size-4">{icon}</span>
      <div className="min-w-0">
        <p className="font-semibold">{label}</p>
        <p className="break-words text-neutral-7">{children}</p>
      </div>
    </div>
  );
}

export type CvColumnsProps = { profile: Profile; entries: Entries; hasPhoto: boolean };

/**
 * Modèle « Deux colonnes » : colonne gauche (bandeau couleur avec photo,
 * nom et titre ; puis fond foncé avec contact, formation, langues,
 * certifications) et colonne droite (profil, compétences en barres,
 * expériences, projets). Sections vides masquées.
 */
export function CvColumns({ profile, entries, hasPhoto }: CvColumnsProps) {
  // Bandeau dans la couleur choisie : texte clair si elle est sombre.
  const darkBand = profile.cv_color ? isDarkColor(profile.cv_color) : true;
  const [firstName, ...rest] = (profile.full_name || "Ton nom").trim().split(/\s+/);
  const lastName = rest.join(" ");
  const links = [profile.linkedin, profile.github, profile.website].filter(Boolean) as string[];

  return (
    <article className="cv-sheet mx-auto grid w-[210mm] min-h-[297mm] grid-cols-[38%_1fr] bg-neutral-1 text-[0.8rem] leading-relaxed text-neutral-12 shadow-lg print:shadow-none">
      {/* ── Colonne gauche ── */}
      <aside className="flex flex-col bg-neutral-12 text-neutral-1 print:min-h-[297mm]">
        <div className="flex flex-col items-center gap-2.5 bg-accent-9 px-6 pt-[9mm] pb-6 text-center">
          {hasPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL signée courte (route /api/profile/photo)
            <img src="/api/profile/photo" alt="" className="size-[34mm] rounded-full border-4 border-neutral-12/10 object-cover" />
          ) : (
            <div aria-hidden className="flex size-[30mm] items-center justify-center rounded-full bg-neutral-12 text-4xl font-bold text-neutral-1">
              {initials(profile.full_name)}
            </div>
          )}
          <h1 className={cn("text-[1.65rem] leading-tight font-extrabold tracking-wider uppercase", darkBand ? "text-neutral-1" : "text-neutral-11")}>
            {firstName}
            {lastName && (
              <>
                <br />
                {lastName}
              </>
            )}
          </h1>
          {profile.headline && (
            <p className={cn("text-[0.8rem] font-extrabold tracking-wide uppercase", darkBand ? "text-neutral-2" : "text-neutral-12")}>
              {profile.headline}
            </p>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-5 px-6 py-6">
          {(profile.phone || profile.contact_email || profile.location || links.length > 0) && (
            <section>
              <SideHeading icon={<CircleUserRound />}>Contact</SideHeading>
              <div className="flex flex-col gap-3">
                {profile.phone && (
                  <SideLine icon={<Phone />} label="Téléphone">
                    {profile.phone}
                  </SideLine>
                )}
                {profile.contact_email && (
                  <SideLine icon={<Mail />} label="E-mail">
                    {profile.contact_email}
                  </SideLine>
                )}
                {profile.location && (
                  <SideLine icon={<MapPin />} label="Adresse">
                    {profile.location}
                  </SideLine>
                )}
                {links.length > 0 && (
                  <SideLine icon={<Globe />} label="Liens">
                    {links.map((link) => (
                      <a key={link} href={link} className="block">
                        {displayUrl(link)}
                      </a>
                    ))}
                  </SideLine>
                )}
              </div>
            </section>
          )}

          {entries.education.length > 0 && (
            <section>
              <SideHeading icon={<BookOpen />}>Formation</SideHeading>
              <div className="flex flex-col gap-4">
                {entries.education.map((education) => (
                  <div key={education.id} className="break-inside-avoid">
                    {(education.start_date || education.end_date) && (
                      <p className="text-[0.95rem] font-bold">{formatPeriod(education.start_date, education.end_date, "en cours")}</p>
                    )}
                    <p className="text-[0.72rem] font-bold">{education.degree}</p>
                    {education.school && <p className="mt-0.5 text-neutral-7">{education.school}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {entries.languages.length > 0 && (
            <section>
              <SideHeading icon={<Languages />}>Langues</SideHeading>
              <ul className="flex flex-col gap-2">
                {entries.languages.map((language) => (
                  <li key={language.id} className="grid grid-cols-[1fr_45%] items-center gap-3">
                    <span className="text-neutral-6">
                      {language.name}
                      {language.level && !language.score && <span className="text-neutral-8"> · {language.level}</span>}
                    </span>
                    {language.score ? <Bar level={language.score as SkillLevel} tone="dark" /> : <span />}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {entries.certifications.length > 0 && (
            <section>
              <SideHeading icon={<Award />}>Certifications</SideHeading>
              <div className="flex flex-col gap-3">
                {entries.certifications.map((certification) => (
                  <div key={certification.id} className="break-inside-avoid">
                    <p className="font-semibold">{certification.name}</p>
                    <p className="text-neutral-7">
                      {[certification.issuer, certification.issued_on && formatMonth(certification.issued_on)].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </aside>

      {/* ── Colonne droite ── */}
      <div className="flex flex-col gap-6 px-[9mm] pt-[10mm] pb-[10mm]">
        {profile.summary && (
          <section>
            <MainHeading icon={<CircleUserRound />} />
            <CvRichText text={profile.summary} className="text-neutral-11" />
          </section>
        )}

        {entries.skills.length > 0 && (
          <section>
            <MainHeading icon={<Wrench />}>Compétences</MainHeading>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-2.5">
              {entries.skills.map((skill) => (
                <li key={skill.id} className="flex flex-col gap-1 break-inside-avoid">
                  <span className="text-neutral-11">{skill.name}</span>
                  <Bar level={skill.level as SkillLevel} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {entries.experiences.length > 0 && (
          <section>
            <MainHeading icon={<Briefcase />}>Expériences</MainHeading>
            <div className="flex flex-col gap-4">
              {entries.experiences.map((experience) => (
                <div key={experience.id} className="break-inside-avoid">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="text-[0.95rem] font-bold">{experience.title}</p>
                    <p className="text-[0.72rem] font-bold">{formatPeriod(experience.start_date, experience.end_date)}</p>
                  </div>
                  {(experience.organization || experience.location) && (
                    <p className="font-bold text-neutral-9">{[experience.organization, experience.location].filter(Boolean).join(", ")}</p>
                  )}
                  {experience.description && <CvRichText text={experience.description} className="mt-1 text-[0.75rem] text-neutral-11" />}
                </div>
              ))}
            </div>
          </section>
        )}

        {entries.projects.length > 0 && (
          <section>
            <MainHeading icon={<Sparkles />}>Projets</MainHeading>
            <div className="flex flex-col gap-3">
              {entries.projects.map((project) => (
                <div key={project.id} className="break-inside-avoid">
                  <p className="font-bold">
                    {project.name}
                    {project.url && (
                      <a href={project.url} className="ml-2 text-[0.72rem] font-normal text-neutral-9">
                        {displayUrl(project.url)}
                      </a>
                    )}
                  </p>
                  {project.description && <CvRichText text={project.description} className="text-neutral-11" />}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
