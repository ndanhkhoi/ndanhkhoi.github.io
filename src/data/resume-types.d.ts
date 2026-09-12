/* Shape of src/data/resume.js.
 *
 * The data itself stays plain ESM so scripts/check-pdf.mjs (plain node, no
 * build step) can import the same file the site renders. These types are what
 * makes `astro check` fail on a typo instead of quietly rendering nothing. */

export interface Contact {
  icon: "location" | "phone" | "mail" | "globe" | "";
  text: string;
  href?: string;
}

export interface Education {
  degree: string;
  school: string;
  period: string;
  detail?: string;
}

export interface Experience {
  position: string;
  company: string;
  location?: string;
  period: string;
  highlights: string[];
}

export interface Project {
  name: string;
  role?: string;
  period: string;
  link?: string;
  highlights: string[];
}

export interface Writing {
  title: string;
  highlights: string[];
}

export interface Award {
  name: string;
  extra?: string;
}

export interface SkillGroup {
  label: string;
  items: string[];
}

export interface Language {
  name: string;
  note?: string;
}

/** Web-only framing - never rendered into the A4 document or cv.pdf. */
export interface WebExtras {
  tagline: string;
  stats: { value: string; label: string }[];
  links: { label: string; href: string }[];
}

export interface Resume {
  meta: { name: string; jobTitle: string; contacts: Contact[] };
  labels: Record<
    | "summary"
    | "education"
    | "experience"
    | "projects"
    | "writing"
    | "awards"
    | "skills"
    | "additional"
    | "languages"
    | "interests",
    string
  >;
  summary: string;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  writing: Writing[];
  awards: Award[];
  skills: SkillGroup[];
  web: WebExtras;
  languages: Language[];
  interests: string[];
}
