import resume from "../data/resume.js";

/* Which sections the web resume shows, in page order.
 *
 * One list drives both the nav and the scrollspy (src/scripts/site.ts reads
 * the same ids off the DOM). A section whose data is empty drops out of both at
 * once - the same self-hiding rule the A4 document follows.
 *
 * Keep this list in the order the sections appear in src/pages/index.astro:
 * a nav that lists them in a different order reads as wrong even though every
 * link still works.
 *
 * `title` comes from resume.labels so the CV's language is set in one place;
 * `nav` is the short form, because the header runs out of room long before a
 * label like "Technical Writing & Community Contribution" fits.
 */
export interface SectionMeta {
  id: string;
  nav: string;
  title: string;
}

const CANDIDATES: { id: string; nav: string; title: string; show: boolean }[] = [
  { id: "about", nav: "About", title: resume.labels.summary, show: !!resume.summary },
  {
    id: "experience",
    nav: "Experience",
    title: resume.labels.experience,
    show: resume.experience.length > 0,
  },
  { id: "projects", nav: "Projects", title: resume.labels.projects, show: resume.projects.length > 0 },
  { id: "writing", nav: "Writing", title: resume.labels.writing, show: resume.writing.length > 0 },
  { id: "skills", nav: "Skills", title: resume.labels.skills, show: resume.skills.length > 0 },
  { id: "awards", nav: "Awards", title: resume.labels.awards, show: resume.awards.length > 0 },
  {
    id: "education",
    nav: "Education",
    title: resume.labels.education,
    show: resume.education.length > 0,
  },
];

export const sections: SectionMeta[] = CANDIDATES.filter((s) => s.show).map((s) => ({
  id: s.id,
  nav: s.nav,
  title: s.title,
}));

export const sectionById = (id: string): SectionMeta => {
  const found = sections.find((s) => s.id === id);
  if (!found) throw new Error(`No visible section "${id}" - check src/lib/sections.ts`);
  return found;
};
