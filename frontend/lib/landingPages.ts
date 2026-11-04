/** Public SEO landing pages (German content). Each targets one distinct search intent; see ROUTE_KEYWORDS-style mapping in `keyword`. */

export interface LandingSection {
  heading: string;
  body: string[];
  bullets?: string[];
  link?: { href: string; label: string };
}

export interface LandingPage {
  slug: string;
  /** Page <title> (the site name is appended by the title template unless it is already part of it). */
  title: string;
  description: string;
  h1: string;
  intro: string;
  keyword: string;
  sections: LandingSection[];
  faq: { question: string; answer: string }[];
  /** Slugs of related landing pages, shown as internal links. */
  related: string[];
  /** Slug of the English counterpart under /en, when a genuine translation exists (drives hreflang). */
  enSlug?: string;
  /** Existing app pages that give a hands-on sample without registration. */
  practice: { href: string; label: string }[];
}

export const LANDING_PAGES: LandingPage[] = [
  {
    slug: "deutsch-lernen",
    enSlug: "learn-german",
    title: "Deutsch lernen online: von A1 bis C1",
    description: "Deutsch lernen online mit Wortschatz, Grammatik, Redemitteln und Prüfungsübungen. Kostenlos starten und in deinem Tempo Fortschritte machen.",
    h1: "Deutsch lernen online – von A1 bis C1",
    intro:
      "Wer Deutsch online lernen will, braucht einen klaren Weg: erst verstehen, dann üben, dann anwenden. DeutschCertify verbindet Wortschatz, Grammatik, Redemittel und Prüfungsaufgaben in einer Lernumgebung, die du im Browser nutzt.",
    keyword: "Deutsch lernen online",
    sections: [
      {
        heading: "Ein Lernweg statt vieler loser Übungen",
        body: [
          "Die meisten Lernenden scheitern nicht an fehlender Motivation, sondern an fehlender Struktur. Deshalb sind die Inhalte nach Niveaustufen geordnet. Du siehst, was zu deinem Niveau passt, und musst nicht zwischen Dutzenden Quellen springen.",
          "Jede Lektion ist kurz genug für eine Pause und klar genug, um sie ohne Vorwissen zu beginnen.",
        ],
        bullets: ["Wortschatz mit Beispielsätzen", "Grammatik-Lektionen mit Übungen", "Redemittel für Schreiben und Sprechen", "Leseverstehen mit Aufgaben"],
        link: { href: "/learn", label: "Kostenlos ausprobieren" },
      },
      {
        heading: "Alle vier Fertigkeiten üben",
        body: [
          "Lesen, Hören, Schreiben und Sprechen entwickeln sich nicht automatisch gleich schnell. Gerade wer nur Vokabeln lernt, merkt in der Prüfung, dass die Anwendung fehlt. Mit strukturierten Aufgaben trainierst du jede Fertigkeit gezielt.",
        ],
        link: { href: "/features", label: "Alle Funktionen ansehen" },
      },
      {
        heading: "Lernen mit KI-Unterstützung",
        body: [
          "Der KI-Tutor gibt Hinweise, korrigiert Texte und erklärt Grammatik. Die Nutzung hat tägliche Grenzen: Im kostenlosen Tarif ist ein Kontingent enthalten, Premium erhöht diese Grenzen.",
        ],
        link: { href: "/pricing", label: "Tarife vergleichen" },
      },
    ],
    faq: [
      { question: "Kann ich kostenlos Deutsch lernen?", answer: "Ja. Du kannst ein kostenloses Konto erstellen und die Übungsinhalte nutzen. Premium erhöht nur die täglichen Grenzen der KI-Funktionen." },
      { question: "Für welche Niveaus ist DeutschCertify geeignet?", answer: "Die Inhalte sind nach den Niveaustufen des Gemeinsamen Europäischen Referenzrahmens geordnet. Der Schwerpunkt liegt auf der Vorbereitung für telc B1 und den DTZ." },
      { question: "Brauche ich eine App?", answer: "Nein. DeutschCertify läuft im Browser auf Computer, Tablet und Smartphone." },
    ],
    related: ["deutsch-lernen-app", "deutsch-b1", "deutscher-wortschatz", "deutsche-grammatik"],
    practice: [{ href: "/learn", label: "Gratis-Beispiele zum Lernen" }],
  },
  {
    slug: "deutsch-lernen-app",
    enSlug: "german-learning-app",
    title: "Deutsch lernen App: im Browser lernen und üben",
    description: "Die Deutsch-lernen-App im Browser: Übungen, Prüfungsvorbereitung und KI-Tutor. Ohne Download, auf Smartphone, Tablet und Computer.",
    h1: "Deutsch lernen mit der App im Browser",
    intro:
      "Du suchst eine App, mit der du unterwegs Deutsch üben kannst? DeutschCertify funktioniert direkt im Browser. Es gibt nichts zu installieren, und dein Fortschritt wird in deinem Konto gespeichert.",
    keyword: "Deutsch lernen App",
    sections: [
      {
        heading: "Das bietet die Lernplattform",
        body: ["Du findest Lerninhalte und Prüfungsaufgaben an einem Ort, statt zwischen mehreren Apps zu wechseln."],
        bullets: ["Wortschatz, Grammatik und Redemittel", "Prüfungsübungen für telc und DTZ", "Probeprüfungen mit Ergebnisbericht", "KI-Tutor mit Hinweisen und Korrekturen"],
        link: { href: "/features", label: "Funktionen im Überblick" },
      },
      {
        heading: "Fortschritt, der mitläuft",
        body: ["Dein Fortschritt wird gespeichert. So kannst du am Handy beginnen und am Laptop weitermachen, ohne den Überblick zu verlieren."],
      },
      {
        heading: "Kostenlos starten",
        body: ["Die Registrierung ist kostenlos und braucht keine Zahlungsdaten. Du kannst vorher Beispiele ansehen und erst später entscheiden."],
        link: { href: "/pricing", label: "Preise und Tarife" },
      },
    ],
    faq: [
      { question: "Gibt es eine App für iPhone und Android?", answer: "Die Plattform läuft im mobilen Browser. Eine Installation ist nicht nötig." },
      { question: "Ist die App kostenlos?", answer: "Es gibt einen kostenlosen Tarif mit den Lern- und Übungsinhalten. Premium erhöht die täglichen KI-Grenzen." },
    ],
    related: ["deutsch-lernen", "telc-b1-vorbereitung", "dtz-b1-vorbereitung"],
    practice: [{ href: "/mock-test", label: "Probeprüfung ansehen" }],
  },
  {
    slug: "deutsch-b1",
    title: "Deutsch B1 Übungen: Lesen, Schreiben, Wortschatz",
    description: "Deutsch B1 Übungen für Leseverstehen, Grammatik, Wortschatz und Redemittel. Kostenlos ausprobieren und gezielt auf die B1-Prüfung hinarbeiten.",
    h1: "Deutsch B1 Übungen und Lernmaterial",
    intro:
      "B1 ist die Stufe, auf der du dich im Alltag sicher verständigst und einfache Texte selbst schreibst. Viele Prüfungen, etwa für Integration oder Einbürgerung, orientieren sich an diesem Niveau.",
    keyword: "Deutsch B1 Übungen",
    sections: [
      {
        heading: "Was du auf B1 können solltest",
        body: ["Auf B1 verstehst du die Hauptpunkte klarer Standardsprache, kannst über Erfahrungen berichten und Meinungen kurz begründen."],
        bullets: ["Nebensätze mit weil, obwohl, dass und wenn", "Konnektoren wie deshalb, trotzdem, außerdem", "Verben mit Präpositionen", "Redemittel für Brief, E-Mail und Gespräch"],
      },
      {
        heading: "Gezielt üben",
        body: ["Mit Leseaufgaben trainierst du Verstehen unter Zeitdruck. Grammatik-Lektionen schließen Lücken, die beim Lesen und Schreiben auffallen."],
        link: { href: "/learn/reading", label: "B1-Leseverstehen ausprobieren" },
      },
      {
        heading: "Von der Übung zur Prüfung",
        body: ["Wenn du das Niveau gefestigt hast, bereitest du dich gezielt auf die Prüfung vor."],
        link: { href: "/telc-b1-vorbereitung", label: "telc B1 Vorbereitung" },
      },
    ],
    faq: [
      { question: "Wie lange dauert es, B1 zu erreichen?", answer: "Das hängt von Vorkenntnissen und Lernzeit ab. Regelmäßiges, kurzes Üben bringt meist mehr als seltene lange Lerneinheiten." },
      { question: "Sind die Übungen echte Prüfungsfragen?", answer: "Nein. Sie folgen Format und Schwierigkeit der Prüfungen, sind aber eigens für das Üben geschrieben." },
    ],
    related: ["telc-b1-vorbereitung", "dtz-b1-vorbereitung", "deutsche-grammatik", "deutscher-wortschatz"],
    practice: [{ href: "/learn/reading", label: "B1-Leseübung" }, { href: "/learn/grammar", label: "Grammatik-Beispiel" }],
  },
  {
    slug: "telc-b1-vorbereitung",
    enSlug: "telc-b1-preparation",
    title: "telc B1 Vorbereitung: Übungen und Probeprüfung",
    description: "telc B1 Vorbereitung mit Übungen zu Lesen, Sprachbausteinen, Hören, Schreiben und Sprechen. Mit Probeprüfungen und detaillierten Ergebnissen.",
    h1: "telc B1 Vorbereitung online",
    intro:
      "Die telc-Prüfung Deutsch B1 besteht aus einem schriftlichen und einem mündlichen Teil. Wer das Format kennt und jeden Teil geübt hat, geht deutlich ruhiger in die Prüfung.",
    keyword: "TELC B1 Vorbereitung",
    sections: [
      {
        heading: "Aufbau der Prüfung",
        body: ["Die Prüfung prüft Leseverstehen, Sprachbausteine, Hörverstehen, Schriftlichen Ausdruck und Mündlichen Ausdruck. Die genauen Zeiten und Punkte legt der Prüfungsanbieter fest; prüfe sie vor der Anmeldung."],
        link: { href: "/exams/telc", label: "telc im Detail" },
      },
      {
        heading: "So bereitest du dich vor",
        body: ["Üben ist am wirksamsten, wenn du Aufgabe für Aufgabe vorgehst und Fehler auswertest."],
        bullets: ["Leseverstehen: Aufgabentypen erkennen und Zeit einteilen", "Sprachbausteine: Grammatik und Wortschatz im Kontext", "Schreiben: Redemittel für Brief und E-Mail", "Sprechen: typische Gesprächssituationen durchspielen"],
        link: { href: "/learn/redemittel", label: "Redemittel ansehen" },
      },
      {
        heading: "Probeprüfung unter Prüfungsbedingungen",
        body: ["In einer zeitbegrenzten Probeprüfung siehst du, wo du stehst. Der Ergebnisbericht zeigt, welche Teile noch Übung brauchen."],
        link: { href: "/mock-test", label: "Probeprüfung kennenlernen" },
      },
    ],
    faq: [
      { question: "Sind das die echten telc-Aufgaben?", answer: "Nein. DeutschCertify ist unabhängig und nicht mit dem Prüfungsanbieter verbunden. Die Aufgaben sind eigens zum Üben geschrieben." },
      { question: "Kann ich auch Sprechen und Schreiben üben?", answer: "Ja. Es gibt Übungen mit Redemitteln und einen KI-Tutor, der Hinweise und Korrekturen geben kann." },
    ],
    related: ["dtz-b1-vorbereitung", "deutsch-b1", "redemittel-deutsch"],
    practice: [{ href: "/learn/reading", label: "Leseverstehen testen" }, { href: "/mock-test", label: "Probeprüfung" }],
  },
  {
    slug: "dtz-b1-vorbereitung",
    enSlug: "dtz-b1-preparation",
    title: "DTZ B1 Prüfung Vorbereitung: Übungen online",
    description: "DTZ-Vorbereitung für A2–B1: Aufbau des Deutsch-Test für Zuwanderer, Übungen zu allen Fertigkeiten und Probeprüfungen online.",
    h1: "DTZ Prüfung Vorbereitung online",
    intro:
      "Der Deutsch-Test für Zuwanderer (DTZ) prüft Deutsch auf den Niveaus A2 und B1 und ist ein häufiger Nachweis im Integrationskontext. Hier erfährst du, wie du dich vorbereiten kannst.",
    keyword: "DTZ B1 Prüfung Vorbereitung",
    sections: [
      {
        heading: "Was der DTZ prüft",
        body: ["Geprüft werden Lesen, Hören, Schreiben und Sprechen. Das Ergebnis zeigt, ob du A2 oder B1 erreicht hast."],
        link: { href: "/exams/dtz", label: "DTZ im Detail" },
      },
      {
        heading: "Vorbereitung in kleinen Schritten",
        body: ["Plane regelmäßig kurze Lerneinheiten ein und wiederhole Fehler gezielt."],
        bullets: ["Alltagswortschatz zu Arbeit, Wohnen und Behörden", "Kurze Texte und E-Mails schreiben", "Gespräche mit Redemitteln vorbereiten"],
        link: { href: "/learn/expressions", label: "Wortschatz üben" },
      },
      {
        heading: "Probeprüfung",
        body: ["Mit einer Probeprüfung gewöhnst du dich an Zeitdruck und Ablauf."],
        link: { href: "/mock-test", label: "Probeprüfung ansehen" },
      },
    ],
    faq: [
      { question: "Was ist der Unterschied zwischen DTZ und telc B1?", answer: "Der DTZ deckt A2 und B1 ab und ist auf den Integrationskontext ausgerichtet. telc Deutsch B1 prüft ausschließlich B1. Welche Prüfung nötig ist, hängt vom Zweck ab." },
      { question: "Gibt es offizielle Aufgaben?", answer: "Offizielle Prüfungsaufgaben gehören den Anbietern. Hier findest du eigene Übungen im Prüfungsformat." },
    ],
    related: ["telc-b1-vorbereitung", "deutsch-b1", "deutscher-wortschatz"],
    practice: [{ href: "/mock-test", label: "Probeprüfung" }],
  },
  {
    slug: "deutsche-grammatik",
    title: "Deutsche Grammatik Übungen mit Erklärungen",
    description: "Deutsche Grammatik üben: Nebensätze, Verben mit Präpositionen, Artikel und mehr. Lektionen mit Beispielen und Übungen kostenlos testen.",
    h1: "Deutsche Grammatik üben und verstehen",
    intro:
      "Grammatik wird leichter, wenn Regel und Beispiel zusammenkommen. Die Lektionen erklären ein Thema kompakt und lassen dich es sofort anwenden.",
    keyword: "Deutsche Grammatik Übungen",
    sections: [
      {
        heading: "Typische Themen",
        body: ["Diese Themen verursachen auf B1 besonders oft Fehler:"],
        bullets: ["Nebensätze und Verbstellung", "Verben mit Präpositionen (warten auf, sich freuen über)", "Nomen-Verb-Verbindungen (eine Entscheidung treffen)", "Artikel, Kasus und Adjektivendungen"],
      },
      {
        heading: "Erst verstehen, dann üben",
        body: ["Lies die Erklärung, sieh dir die Beispielsätze an und löse danach die Übung. Fehler zeigen dir, welche Regel du noch einmal ansehen solltest."],
        link: { href: "/learn/grammar", label: "Grammatik-Lektionen ansehen" },
      },
    ],
    faq: [
      { question: "Sind die Grammatik-Übungen kostenlos?", answer: "Ein Teil der Lektionen ist ohne Konto zugänglich. Mit einem kostenlosen Konto speicherst du deinen Fortschritt." },
      { question: "Wie übe ich Verben mit Präpositionen?", answer: "Lerne das Verb immer zusammen mit Präposition und Kasus, zum Beispiel „warten auf + Akkusativ“, und bilde eigene Sätze." },
    ],
    related: ["deutsch-b1", "deutscher-wortschatz", "redemittel-deutsch", "deutsch-c1"],
    practice: [{ href: "/learn/grammar", label: "Grammatik-Beispiele" }],
  },
  {
    slug: "deutscher-wortschatz",
    title: "Deutsch Wortschatz lernen: Methoden und Übungen",
    description: "Deutschen Wortschatz lernen mit Beispielsätzen, Wiederholung und Übungen. Tipps für B1 und Wörter, die wirklich in Prüfungen helfen.",
    h1: "Deutschen Wortschatz lernen",
    intro:
      "Wörter bleiben im Kopf, wenn du sie im Satz und mehrfach wiederholst. Einzelne Vokabellisten ohne Kontext vergisst man schnell.",
    keyword: "Deutsch Wortschatz lernen",
    sections: [
      {
        heading: "Wörter im Kontext lernen",
        body: ["Lerne Nomen mit Artikel und Plural, Verben mit Beispielsatz. So merkst du dir Form und Gebrauch zugleich."],
        bullets: ["Nomen: der Termin, die Termine", "Verben: einen Termin vereinbaren", "Wendungen statt Einzelwörter"],
        link: { href: "/learn/expressions", label: "Wortschatz-Beispiele ansehen" },
      },
      {
        heading: "Regelmäßig wiederholen",
        body: ["Zehn Minuten täglich wirken besser als eine Stunde pro Woche. Wiederhole neue Wörter nach einem Tag, nach drei Tagen und nach einer Woche."],
      },
    ],
    faq: [
      { question: "Wie viele Wörter brauche ich für B1?", answer: "Als grobe Orientierung gelten einige tausend Wörter. Wichtiger als die Zahl ist, dass du die Wörter aktiv verwenden kannst." },
      { question: "Gibt es tägliche Wörter?", answer: "Ja, Lernende können sich im Konto tägliche Wörter anzeigen lassen." },
    ],
    related: ["deutsch-lernen", "deutsche-grammatik", "redemittel-deutsch"],
    practice: [{ href: "/learn/expressions", label: "Wortschatz üben" }],
  },
  {
    slug: "redemittel-deutsch",
    title: "Redemittel Deutsch für Schreiben und Sprechen",
    description: "Wichtige deutsche Redemittel für Brief, E-Mail, Meinung und Gespräch. Sprachbausteine sicher anwenden in Schreiben und Sprechen.",
    h1: "Deutsche Redemittel für Schreiben und Sprechen",
    intro:
      "Redemittel sind feste Formulierungen, die du in Prüfung und Alltag wiederverwenden kannst: etwa um zu bitten, zuzustimmen oder zu widersprechen.",
    keyword: "Deutsche Redemittel",
    sections: [
      {
        heading: "Warum Redemittel helfen",
        body: ["Mit festen Wendungen musst du nicht jeden Satz neu bauen. Das spart Zeit und senkt die Fehlerquote, besonders in mündlicher und schriftlicher Prüfung."],
        bullets: ["Bitten: Könnten Sie mir bitte …?", "Meinung: Meiner Meinung nach …", "Zustimmen: Da stimme ich Ihnen zu.", "Widersprechen: Das sehe ich anders, weil …"],
        link: { href: "/learn/redemittel", label: "Redemittel ansehen" },
      },
      {
        heading: "Anwenden statt auswendig lernen",
        body: ["Schreibe eigene Beispielsätze zu deinem Alltag und passe die Wendungen an. So klingen sie natürlich."],
      },
    ],
    faq: [
      { question: "Welche Redemittel brauche ich für B1 Schreiben?", answer: "Anrede und Gruß, Grund des Schreibens, Bitte, Vorschlag und Abschluss. Lerne je zwei bis drei Varianten." },
      { question: "Hilft der KI-Tutor beim Schreiben?", answer: "Ja, er kann Hinweise und Korrekturen geben. Die Nutzung hat tägliche Grenzen." },
    ],
    related: ["telc-b1-vorbereitung", "deutsche-grammatik", "deutscher-wortschatz"],
    practice: [{ href: "/learn/redemittel", label: "Redemittel-Beispiele" }],
  },
  {
    slug: "deutsch-c1",
    title: "Deutsch C1 Übungen und Lernressourcen",
    description: "Deutsch C1 üben: anspruchsvolle Grammatik, Wortschatz und Redemittel für fortgeschrittene Lernende. Tipps für Nomen-Verb-Verbindungen und mehr.",
    h1: "Deutsch C1 üben",
    intro:
      "Auf C1 geht es um Genauigkeit und Stil: Du drückst Gedanken differenziert aus und verstehst anspruchsvolle Texte. Das gelingt nur mit gezielter Arbeit an Wortschatz und Struktur.",
    keyword: "Deutsch C1 Übungen",
    sections: [
      {
        heading: "Schwerpunkte auf C1",
        body: ["Fortgeschrittene Lernende profitieren besonders von diesen Themen:"],
        bullets: ["Nomen-Verb-Verbindungen (in Betracht ziehen, zur Verfügung stellen)", "Partizipialkonstruktionen und Nominalstil", "Konjunktiv I und II", "Abstrakter und akademischer Wortschatz"],
        link: { href: "/learn/grammar", label: "Grammatik ansehen" },
      },
      {
        heading: "Lesen und Schreiben vertiefen",
        body: ["Lies regelmäßig längere Texte und fasse sie in eigenen Worten zusammen. Das trainiert Verständnis und Ausdruck zugleich."],
        link: { href: "/learn/reading", label: "Leseverstehen üben" },
      },
    ],
    faq: [
      { question: "Gibt es C1-Prüfungsvorbereitung?", answer: "Der Schwerpunkt von DeutschCertify liegt auf telc B1 und DTZ. Eine eigene C1-Probeprüfung gibt es nicht. Welche Lerninhalte für C1 verfügbar sind, siehst du in den Bereichen Grammatik, Wortschatz und Lesen." },
    ],
    related: ["deutsche-grammatik", "deutscher-wortschatz", "deutsch-b1"],
    practice: [{ href: "/learn/grammar", label: "Grammatik-Beispiele" }],
  },
];

export const getGermanSlugForEn = (enSlug: string) => LANDING_PAGES.find((p) => p.enSlug === enSlug)?.slug;

export const getLandingPage = (slug: string) => LANDING_PAGES.find((p) => p.slug === slug);
