/**
 * ALL CV data - edit personal info in this file only; no layout changes needed.
 *
 * One source, three renderings: the web resume (/), the A4 print source
 * (/print.html) and cv.pdf, which is printed from that source. Everything below
 * feeds all three, except `web`, which is web-only (see its own note).
 *
 * Conventions:
 * - Any section left empty ([] or "") self-hides from both pages.
 * - `labels` = section titles - change the CV language here.
 * - `meta.contacts`: icon is one of {location, phone, mail, globe} (empty = no icon);
 *   optional `href` to make it a link (tel:/mailto:/https:).
 * - Content transferred verbatim from the original CV (Nguyen-Duc-Anh-Khoi-CV 2.pdf).
 *
 * Plain ESM so both Astro and plain node can read it: scripts/check-pdf.mjs
 * imports this file to derive what cv.pdf must contain.
 */

/** @type {import("./resume-types").Resume} */
const resume = {
  meta: {
    name: "NGUYEN DUC ANH KHOI",
    jobTitle: "Senior Java Backend Developer",
    contacts: [
      { icon: "location", text: "Ho Chi Minh City, Viet Nam" },
      { icon: "phone", text: "0776524327", href: "tel:0776524327" },
      { icon: "mail", text: "khoinda.611@gmail.com", href: "mailto:khoinda.611@gmail.com" },
      { icon: "globe", text: "https://khoinda.io.vn/", href: "https://khoinda.io.vn/" }
    ]
  },

  labels: {
    summary: "Objective",
    education: "Education",
    experience: "Work Experience",
    projects: "Projects",
    writing: "Technical Writing & Community Contribution",
    awards: "Honors & Awards",
    skills: "Skills",
    additional: "Additional",
    languages: "Languages",
    interests: "Interests"
  },

  summary:
    "Senior Java Backend Developer with 6+ years of experience building scalable microservices for enterprise healthcare " +
    "platforms. Proficient in Spring Boot ecosystem, event-driven architecture, and performance optimization for high-" +
    "concurrency systems. Experienced in mentoring development teams and maintaining high code quality standards",

  education: [
    {
      degree: "Major: Information Technology",
      school: "Can Tho University",
      period: "Oct 2015 - Dec 2019",
      detail: "GPA: 9.48/10"
    }
  ],

  experience: [
    {
      position: "Team Lead",
      company: "VNPT IT",
      location: "",
      period: "2023 - Present",
      highlights: [
        "Lead and mentor a team of 5 developers, conducting bi-weekly 1-on-1s that improved team retention to 100% over 2 years",
        "Established team-wide commit conventions and led the design and rollout of a Maven extension that installs a Git " +
          "commit-msg hook to enforce them, adopted across 4 microservice teams spanning 4 projects",
        "Establish and enforce coding standards, conduct thorough code reviews to maintain high code quality across projects, " +
          "led 500+ code reviews annually, reducing production bugs by 40%",
        "Architected and led the implementation of an asynchronous e-invoice integration flow to replace the traditional " +
          "synchronous process, improving system responsiveness and reducing coupling between VNPT HIS and external " +
          "e-invoicing systems",
        "Analyzed requirements, designed solutions, and led the team to upgrade the VNPT HIS system to comply with new " +
          "Ministry of Health regulations on health insurance reimbursement, enabling hospitals to reliably settle tens of " +
          "billions VND in insurance claims each month",
        "Spearheaded VNPT HIS 4.0 platform upgrade from Java 8 to Java 21, Spring Boot 2.3 to 3.5, and Hibernate 5 to 6, " +
          "enhancing performance and enabling adoption of modern Java features across microservices architecture",
        "Optimize VNPT HIS 4.0 system performance, scaling capacity from 200 to 1,000+ concurrent users through performance " +
          "tuning and architecture improvements",
        "Coordinated closely with QA, DevOps, Business Analysis, and Product teams to consistently complete 2 sprints per " +
          "month, delivering an average of ~100 issues per sprint while ensuring alignment with hospital needs and Ministry " +
          "of Health regulations"
      ]
    },
    {
      position: "Fullstack Developer",
      company: "VNPT IT",
      location: "",
      period: "2019 - 2023",
      highlights: [
        "Co-architected internal core framework extending Spring Boot 3 and Java 21, now adopted by 8 microservice teams, " +
          "reducing boilerplate code by 50% and accelerating new service development from 1 week to 2 days",
        "Developed payment integration library supporting 5 major banking providers (Agribank, BIDV, VietinBank, HDBank, " +
          "VNPT Money), processing 1,000+ transactions daily with 99.9% uptime and average response time under 2s",
        "Maintained and developed 50+ new features for VNPT HIS Java platform serving 4,000+ hospitals nationwide, achieving " +
          "99.5% system availability and resolving 200+ production issues with average resolution time of 4 hours",
        "Designed and implemented a 'Fee & Health Insurance' microservice for VNPT Home & Clinic using Java 17, Spring Boot " +
          "microservices architecture, Kafka, Redis, Oracle, React, serving 1,000+ clinics"
      ]
    }
  ],

  projects: [
    {
      name: "Moni - Expense Manager Web App",
      role: "Personal Project",
      period: "Aug 2023 - Present",
      link: "https://moni.khoinda.vn/",
      highlights: [
        "A modern personal finance management platform built to explore latest Java and React ecosystem",
        "Stack: Java 21, Spring Boot 3.x, React 18, PostgreSQL, Redis, Docker, GitHub Actions CI/CD",
        "Implemented JWT authentication, RESTful APIs, responsive UI, and automated deployment pipeline"
      ]
    },
    {
      name: "Inventory",
      role: "Personal Project",
      period: "May 2023 - Aug 2023",
      link: "",
      highlights: [
        "Personal project for inventory and sales management built with enterprise-grade frameworks",
        "Stack: Spring Boot, Jmix Framework, PostgreSQL",
        "Features: Inventory tracking, sales order management, stock alerts, reporting dashboard",
        "Demonstrates rapid development with Jmix enterprise platform and database design skills"
      ]
    },
    {
      name: "Simple Telegram Bot Spring Boot Starter",
      role: "Open source",
      period: "Apr 2021 - Aug 2023",
      link: "https://github.com/ndanhkhoi/simple-telegram-command-bot-spring-boot-starter",
      highlights: [
        "A lightweight library simplifying Telegram bot development with Spring MVC-style annotations",
        "Built with Java, Spring Boot, and reactive programming paradigms",
        "Provides @BotController and @CommandMapping annotations for intuitive bot development",
        "Published on JitPack for community use"
      ]
    }
  ],

  writing: [
    {
      title: "Technical Blog - Viblo Platform",
      highlights: [
        "Published 10+ in-depth articles on backend development and DevOps practices",
        "Topics: Spring Boot, Apache Kafka, Event-Driven Architecture, Docker, GitOps, AOP",
        "Total reach: 30,000+ views from developer community",
        "Profile: https://viblo.asia/u/ndanhkhoi"
      ]
    }
  ],

  awards: [
    { name: "Top 2 Graduate with Excellent Certificate - Can Tho University (GPA: 9.48/10)", extra: "2019" },
    { name: "VNPT Star Award - Outstanding employee contributions", extra: "2020" },
    { name: "IT World Awards - Silver Award in the Healthcare Service Product category for VNPT Home & Clinic (as a member of the project's development team)", extra: "2022" },
    { name: "Certificate of Merit - VNPT Corporation for exceptional performance", extra: "2022" }
  ],

  skills: [
    { label: "Technical Backend", items: ["Java", "Spring Framework", "Hibernate", "JHipster"] },
    { label: "Frontend", items: ["HTML", "CSS", "Bootstrap", "Tailwind CSS", "JavaScript", "TypeScript", "ReactJS"] },
    { label: "Databases", items: ["MySQL", "Oracle", "PostgreSQL", "MongoDB"] },
    { label: "Caching", items: ["Redis"] },
    { label: "Messaging", items: ["Apache Kafka", "RabbitMQ"] },
    {
      label: "Programming paradigms",
      items: [
        "Reactive programming",
        "Functional programming",
        "Object-oriented design",
        "Aspect-oriented programming"
      ]
    },
    { label: "Code Quality", items: ["SonarQube", "ArchUnit"] },
    {
      label: "Architecture & Design",
      items: ["Microservice architecture", "Data structures and algorithms", "Database schema design and implementation"]
    },
    { label: "Monitoring & Performance", items: ["Glowroot", "Application Performance Monitoring (APM) tools"] },
    { label: "DevOps & CI/CD", items: ["Docker", "Portainer", "CI/CD with GitHub Actions", "GitLab CI", "Heroku"] },
    {
      label: "AI-assisted development",
      items: [
        "Proficient with AI-powered coding tools (Cursor, Claude Code, GitHub Copilot, Google Antigravity) to accelerate " +
          "development workflow"
      ]
    },
    { label: "Language", items: ["English (communication)", "Vietnamese (native)"] },
    {
      label: "Leadership & Collaboration",
      items: [
        "Team leadership and mentorship (2+ years leading 5-member development team)",
        "Cross-functional collaboration with QA, DevOps, Product teams",
        "Code review and quality assurance practices"
      ]
    },
    {
      label: "Communication & Professional",
      items: [
        "Technical presentation and knowledge sharing (10+ blog articles, 30K+ views)",
        "Stakeholder management and requirement analysis",
        "Agile/Scrum methodologies"
      ]
    }
  ],

  /* ---------------------------------------------------------------- web only
     Rendered by the web resume (/) and by nothing else - the A4 document and
     cv.pdf ignore this block entirely, and scripts/check-pdf.mjs skips it when
     collecting the URLs the PDF must carry. Keep CV facts above; this is only
     the framing the paper version has no room for. */
  web: {
    tagline:
      "I build the backend systems that keep 4,000+ Vietnamese hospitals running - " +
      "and I lead the people who build them.",
    /* Numbers already proven by the entries above; each one restates a highlight. */
    stats: [
      { value: "6+", label: "Years building JVM backends" },
      { value: "4,000+", label: "Hospitals on the platform" },
      { value: "1,000+", label: "Concurrent users after tuning" },
      { value: "30,000+", label: "Reads on technical writing" }
    ],
    /* Public profiles, shown in the site header and footer. Web-only on
       purpose: the paper CV lists the contact line instead, so these are not
       part of what scripts/check-pdf.mjs requires cv.pdf to carry. */
    links: [
      { label: "GitHub", href: "https://github.com/ndanhkhoi" },
      { label: "Viblo", href: "https://viblo.asia/u/ndanhkhoi" },
      { label: "Website", href: "https://khoinda.io.vn/" }
    ]
  },

  languages: [],

  interests: []
};

export default resume;

