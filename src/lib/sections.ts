import resume from "../data/resume.js";

/* Which sections the web resume shows, in page order.
 *
 * One list drives three things that must never disagree: the nav, the
 * scrollspy (src/scripts/site.ts reads the same ids off the DOM) and the
 * numbering in each section heading. A section whose data is empty drops out
 * of all three at once - the same self-hiding rule the A4 document follows.
 *
 * `title` comes from resume.labels so the CV's language is set in one place;
 * `nav` is the short form, because the header runs out of room long before a
 * label like "Technical Writing & Community Contribution" fits.
 */
export interface SectionMeta {
  id: string;
  nav: string;
  title: string;
  /** "01", "02", ... - printed next to the section title. */
  index: string;
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
  { id: "skills", nav: "Skills", title: resume.labels.skills, show: resume.skills.length > 0 },
  { id: "writing", nav: "Writing", title: resume.labels.writing, show: resume.writing.length > 0 },
  { id: "awards", nav: "Awards", title: resume.labels.awards, show: resume.awards.length > 0 },
  {
    id: "education",
    nav: "Education",
    title: resume.labels.education,
    show: resume.education.length > 0,
  },
];

export const sections: SectionMeta[] = CANDIDATES.filter((s) => s.show).map((s, i) => ({
  id: s.id,
  nav: s.nav,
  title: s.title,
  index: String(i + 1).padStart(2, "0"),
}));

export const sectionById = (id: string): SectionMeta => {
  const found = sections.find((s) => s.id === id);
  if (!found) throw new Error(`No visible section "${id}" - check src/lib/sections.ts`);
  return found;
};
