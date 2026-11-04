import type { LandingPage } from "@/lib/landingPages";

/** English landing pages, written as natural English counterparts of the German ones (not literal translations). Served under /en/<slug>. */
export const LANDING_PAGES_EN: (Omit<LandingPage, "enSlug" | "related"> & { deSlug: string; related: string[] })[] = [
  {
    slug: "learn-german",
    deSlug: "deutsch-lernen",
    title: "Learn German Online: From A1 to C1",
    description: "Learn German online with vocabulary, grammar, useful phrases and exam practice. Start free and progress at your own pace.",
    h1: "Learn German online – from A1 to C1",
    intro: "Learning German online works best with a clear path: understand it, practise it, then use it. DeutschCertify brings vocabulary, grammar, set phrases and exam tasks together in one place you can open in your browser.",
    keyword: "learn German online",
    sections: [
      {
        heading: "One learning path instead of scattered exercises",
        body: ["Most learners don't fail for lack of motivation but for lack of structure. The content is organised by level, so you can see what fits yours instead of jumping between dozens of sources.", "Each lesson is short enough for a break and clear enough to start without prior knowledge."],
        bullets: ["Vocabulary with example sentences", "Grammar lessons with exercises", "Useful phrases (Redemittel) for writing and speaking", "Reading comprehension with tasks"],
        link: { href: "/learn", label: "Try it for free" },
      },
      {
        heading: "Practise all four skills",
        body: ["Reading, listening, writing and speaking don't improve at the same speed. Structured tasks let you train each one on purpose."],
        link: { href: "/features", label: "See all features" },
      },
      {
        heading: "Learning with AI support",
        body: ["The AI tutor gives hints, corrects texts and explains grammar. Usage has daily limits: the free plan includes an allowance and Premium raises it."],
        link: { href: "/pricing", label: "Compare plans" },
      },
    ],
    faq: [
      { question: "Can I learn German for free?", answer: "Yes. You can create a free account and use the practice content. Premium only raises the daily limits of the AI features." },
      { question: "Which levels does DeutschCertify cover?", answer: "Content is organised by the levels of the Common European Framework of Reference. The main focus is preparation for telc B1 and the DTZ." },
      { question: "Do I need to install an app?", answer: "No. DeutschCertify runs in your browser on computer, tablet and phone." },
    ],
    related: ["german-learning-app", "telc-b1-preparation", "dtz-b1-preparation"],
    practice: [{ href: "/learn", label: "Free learning samples" }],
  },
  {
    slug: "german-learning-app",
    deSlug: "deutsch-lernen-app",
    title: "German Learning App: Study in Your Browser",
    description: "A German learning app that runs in your browser: exercises, exam preparation and an AI tutor. No download, on phone, tablet and computer.",
    h1: "A German learning app in your browser",
    intro: "Looking for an app to practise German on the go? DeutschCertify works directly in your browser. There is nothing to install, and your progress is saved to your account.",
    keyword: "German learning app",
    sections: [
      {
        heading: "What the platform offers",
        body: ["Learning content and exam tasks live in one place, so you don't have to switch between apps."],
        bullets: ["Vocabulary, grammar and set phrases", "Exam practice for telc and DTZ", "Mock exams with a results report", "AI tutor with hints and corrections"],
        link: { href: "/features", label: "Features at a glance" },
      },
      {
        heading: "Progress that follows you",
        body: ["Your progress is saved, so you can start on your phone and continue on your laptop without losing track."],
      },
      {
        heading: "Start for free",
        body: ["Registration is free and needs no payment details. You can look at samples first and decide later."],
        link: { href: "/pricing", label: "Pricing and plans" },
      },
    ],
    faq: [
      { question: "Is there an iPhone or Android app?", answer: "The platform runs in your mobile browser, so no installation is needed." },
      { question: "Is it free?", answer: "There is a free plan with the learning and practice content. Premium raises the daily AI limits." },
    ],
    related: ["learn-german", "telc-b1-preparation"],
    practice: [{ href: "/mock-test", label: "See a mock exam" }],
  },
  {
    slug: "telc-b1-preparation",
    deSlug: "telc-b1-vorbereitung",
    title: "telc B1 Preparation: Practice and Mock Exam",
    description: "Prepare for telc German B1 with practice for reading, language elements, listening, writing and speaking, plus mock exams with detailed results.",
    h1: "telc B1 preparation online",
    intro: "The telc Deutsch B1 exam has a written and an oral part. If you know the format and have practised every section, you walk into the exam much calmer.",
    keyword: "telc B1 preparation",
    sections: [
      {
        heading: "How the exam is built",
        body: ["The exam tests reading comprehension, language elements (Sprachbausteine), listening, written expression and oral expression. Exact timings and scoring are set by the exam provider, so check them before you register."],
        link: { href: "/exams/telc", label: "telc in detail" },
      },
      {
        heading: "How to prepare",
        body: ["Practice works best when you take it task by task and review your mistakes."],
        bullets: ["Reading: recognise task types and manage your time", "Language elements: grammar and vocabulary in context", "Writing: useful phrases for letters and emails", "Speaking: rehearse typical conversation situations"],
        link: { href: "/learn/redemittel", label: "Browse useful phrases" },
      },
      {
        heading: "A mock exam under exam conditions",
        body: ["A timed mock exam shows you where you stand. The results report tells you which parts still need work."],
        link: { href: "/mock-test", label: "Get to know the mock exam" },
      },
    ],
    faq: [
      { question: "Are these the real telc tasks?", answer: "No. DeutschCertify is independent and not affiliated with the exam provider. The tasks are written for practice." },
      { question: "Can I practise speaking and writing?", answer: "Yes. There are exercises with set phrases and an AI tutor that can give hints and corrections." },
    ],
    related: ["dtz-b1-preparation", "learn-german"],
    practice: [{ href: "/learn/reading", label: "Try reading practice" }, { href: "/mock-test", label: "Mock exam" }],
  },
  {
    slug: "dtz-b1-preparation",
    deSlug: "dtz-b1-vorbereitung",
    title: "DTZ B1 Exam Preparation: Practice Online",
    description: "Prepare for the DTZ (A2–B1): exam structure, practice for all four skills and mock exams online.",
    h1: "DTZ exam preparation online",
    intro: "The Deutsch-Test für Zuwanderer (DTZ) tests German at levels A2 and B1 and is a common proof of language skills in integration contexts. Here is how you can prepare.",
    keyword: "DTZ B1 exam preparation",
    sections: [
      {
        heading: "What the DTZ tests",
        body: ["Reading, listening, writing and speaking are assessed. The result shows whether you reached A2 or B1."],
        link: { href: "/exams/dtz", label: "DTZ in detail" },
      },
      {
        heading: "Preparing in small steps",
        body: ["Plan short, regular study sessions and review your mistakes on purpose."],
        bullets: ["Everyday vocabulary for work, housing and offices", "Writing short texts and emails", "Preparing conversations with set phrases"],
        link: { href: "/learn/expressions", label: "Practise vocabulary" },
      },
      {
        heading: "Mock exam",
        body: ["A mock exam gets you used to the time pressure and the structure."],
        link: { href: "/mock-test", label: "See the mock exam" },
      },
    ],
    faq: [
      { question: "What is the difference between the DTZ and telc B1?", answer: "The DTZ covers A2 and B1 and is aimed at integration. telc Deutsch B1 tests B1 only. Which one you need depends on your purpose." },
      { question: "Are there official tasks?", answer: "Official exam tasks belong to the providers. Here you find our own exercises in the exam format." },
    ],
    related: ["telc-b1-preparation", "learn-german"],
    practice: [{ href: "/mock-test", label: "Mock exam" }],
  },
];

export const getLandingPageEn = (slug: string) => LANDING_PAGES_EN.find((p) => p.slug === slug);
