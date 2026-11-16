import { formatMonth, formatPeriod } from "../entries";
import { Block, type CvDocumentProps, displayUrl, Heading } from "./CvDocument";
import { CvRichText } from "./CvRichText";

/**
 * CV « Simple » : une seule colonne, sans photo ni initiales, compétences
 * listées par catégorie sans niveau. Les sections vides sont masquées.
 */
export function CvSimple({ profile, entries }: Omit<CvDocumentProps, "hasPhoto">) {
  const contacts = [profile.contact_email, profile.phone, profile.location].filter(Boolean) as string[];
  const links = [profile.linkedin, profile.github, profile.website].filter(Boolean) as string[];
  const skillGroups = [...new Set(entries.skills.map((skill) => skill.category || "Autres"))].map((category) => ({
    category,
    names: entries.skills.filter((skill) => (skill.category || "Autres") === category).map((skill) => skill.name),
  }));

  return (
    <article className="cv-sheet mx-auto flex w-[210mm] min-h-[297mm] flex-col gap-5 bg-neutral-1 p-[16mm] text-[0.82rem] leading-relaxed text-neutral-12 shadow-lg print:shadow-none">
      <header className="flex flex-col gap-0.5 border-b-2 border-accent-9 pb-3">
        <h1 className="text-[1.8rem] leading-tight font-bold text-neutral-12">{profile.full_name || "Ton nom"}</h1>
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
      </header>

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
                  <p className="text-[0.75rem] text-neutral-11">
                    {[formatPeriod(experience.start_date, experience.end_date), experience.location].filter(Boolean).join(" · ")}
                  </p>
                </div>
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
                  <p className="text-[0.75rem] text-neutral-11">
                    {[formatPeriod(education.start_date, education.end_date, "en cours"), education.location].filter(Boolean).join(" · ")}
                  </p>
                </div>
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

      {entries.skills.length > 0 && (
        <Block>
          <section aria-label="Compétences">
            <Heading>Compétences</Heading>
            <ul className="flex flex-col gap-1">
              {skillGroups.map((group) => (
                <li key={group.category}>
                  {skillGroups.length > 1 && <span className="font-semibold">{group.category} : </span>}
                  {group.names.join(", ")}
                </li>
              ))}
            </ul>
          </section>
        </Block>
      )}

      {entries.languages.length > 0 && (
        <Block>
          <section>
            <Heading>Langues</Heading>
            <p>
              {entries.languages
                .map((language) => (language.level ? `${language.name} (${language.level})` : language.name))
                .join(" · ")}
            </p>
          </section>
        </Block>
      )}

      {entries.certifications.length > 0 && (
        <section>
          <Heading>Certifications</Heading>
          <ul className="flex flex-col gap-1">
            {entries.certifications.map((certification) => (
              <li key={certification.id} className="break-inside-avoid">
                <span className="font-semibold">
                  {certification.url ? <a href={certification.url}>{certification.name}</a> : certification.name}
                </span>
                {(certification.issuer || certification.issued_on) && (
                  <span className="text-neutral-11">
                    {" · "}
                    {[certification.issuer, certification.issued_on && formatMonth(certification.issued_on)].filter(Boolean).join(" · ")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
