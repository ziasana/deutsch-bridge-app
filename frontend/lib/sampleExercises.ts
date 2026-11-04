/** Original sample exercises for the public /uebungen pages. Written for practice; they are NOT official exam questions. */

export interface SampleQuestion {
  prompt: string;
  options: string[];
  /** Index into `options`. */
  answer: number;
  explanation: string;
}

export interface SampleExercise {
  slug: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  instructions: string;
  passage?: { heading?: string; lines: string[] };
  questions: SampleQuestion[];
  /** Where to continue inside the app. */
  more: { href: string; label: string };
  /** Related landing page slug. */
  landing: string;
}

const RF = ["richtig", "falsch"];

export const SAMPLE_EXERCISES: SampleExercise[] = [
  {
    slug: "telc-b1-lesen",
    title: "telc B1 Lesen: Übung mit Lösungen",
    description: "Kostenlose Leseverstehen-Übung im B1-Format mit Lösungen und Erklärungen. Original-Übungsmaterial, keine offizielle Prüfung.",
    h1: "telc B1 Lesen – Übung mit Lösungen",
    intro: "Lies den Text und entscheide, ob die Aussagen richtig oder falsch sind. Danach siehst du die Lösung mit Begründung.",
    instructions: "Lies den Aushang. Sind die Aussagen richtig oder falsch?",
    passage: {
      heading: "Aushang im Gemeindezentrum",
      lines: [
        "Sprachcafé jeden Mittwoch, 17 bis 19 Uhr",
        "Sie möchten Deutsch sprechen, ohne Prüfungsdruck? Kommen Sie ins Sprachcafé! Wir treffen uns im Raum 3 im ersten Stock. Eine Anmeldung ist nicht nötig, die Teilnahme ist kostenlos. Getränke bringen Sie bitte selbst mit. In den Ferien findet das Sprachcafé nicht statt. Fragen beantwortet Frau Berger unter der Telefonnummer 0123 456789.",
      ],
    },
    questions: [
      { prompt: "Das Sprachcafé kostet Eintritt.", options: RF, answer: 1, explanation: "Im Text steht: „die Teilnahme ist kostenlos“. Die Aussage ist also falsch." },
      { prompt: "Man muss sich vorher anmelden.", options: RF, answer: 1, explanation: "„Eine Anmeldung ist nicht nötig.“ – also falsch." },
      { prompt: "Das Sprachcafé findet im ersten Stock statt.", options: RF, answer: 0, explanation: "„im Raum 3 im ersten Stock“ – die Aussage ist richtig." },
      { prompt: "Auch in den Ferien kann man teilnehmen.", options: RF, answer: 1, explanation: "„In den Ferien findet das Sprachcafé nicht statt.“ – falsch." },
    ],
    more: { href: "/learn/reading", label: "Mehr Leseübungen ausprobieren" },
    landing: "telc-b1-vorbereitung",
  },
  {
    slug: "telc-b1-sprachbausteine",
    title: "telc B1 Sprachbausteine: Übung mit Lösungen",
    description: "Sprachbausteine-Übung für B1: Lücken im Text ergänzen, mit Lösungen und Erklärungen. Original-Übungsmaterial.",
    h1: "telc B1 Sprachbausteine – Übung",
    intro: "Bei Sprachbausteinen ergänzt du Wörter in einem Text. Wähle für jede Lücke die passende Lösung.",
    instructions: "Lies die E-Mail und wähle für jede Lücke die richtige Lösung.",
    passage: {
      heading: "E-Mail an eine Freundin",
      lines: [
        "Liebe Mia,",
        "vielen Dank für deine Einladung zu deiner Geburtstagsfeier. Ich komme sehr gern, (1) ich am Samstag eigentlich arbeiten muss. Ich habe aber mit meiner Chefin gesprochen. Sie hat gesagt, dass ich früher gehen (2).",
        "Hast du schon überlegt, (3) du dir wünschst? Ich würde mich (4) deine Antwort freuen.",
        "Viele Grüße, Tom",
      ],
    },
    questions: [
      { prompt: "Lücke (1)", options: ["weil", "obwohl", "damit"], answer: 1, explanation: "„obwohl“ drückt einen Gegensatz aus: Tom muss arbeiten, kommt aber trotzdem." },
      { prompt: "Lücke (2)", options: ["darf", "dürfen", "durfte"], answer: 0, explanation: "Nach „dass“ steht das Verb am Ende; zu „ich“ passt „darf“." },
      { prompt: "Lücke (3)", options: ["was", "wann", "wo"], answer: 0, explanation: "Gefragt ist nach einer Sache: „Was wünschst du dir?“" },
      { prompt: "Lücke (4)", options: ["auf", "über", "für"], answer: 0, explanation: "„sich freuen auf + Akkusativ“ bezieht sich auf etwas Zukünftiges: „Ich würde mich auf deine Antwort freuen.“" },
    ],
    more: { href: "/learn/grammar", label: "Grammatik zu Sprachbausteinen üben" },
    landing: "telc-b1-vorbereitung",
  },
  {
    slug: "dtz-b1-lesen",
    title: "DTZ B1 Lesen: Übung mit Lösungen",
    description: "DTZ-Leseübung auf A2–B1-Niveau mit Lösungen und Erklärungen. Eigene Übung im Prüfungsformat, kein offizielles Prüfungsmaterial.",
    h1: "DTZ B1 Lesen – Übung mit Lösungen",
    intro: "Lies die E-Mail und wähle die richtige Antwort. Eine Antwort ist jeweils richtig.",
    instructions: "Lies den Text und wähle a, b oder c.",
    passage: {
      heading: "E-Mail vom Vermieter",
      lines: [
        "Sehr geehrte Frau Yilmaz,",
        "am Dienstag, den 12. März, wird die Heizung in Ihrem Haus gewartet. Der Techniker kommt zwischen 8 und 12 Uhr. Bitte sorgen Sie dafür, dass in dieser Zeit jemand in der Wohnung ist. Wenn Sie nicht da sein können, rufen Sie mich bitte bis Freitag an, dann vereinbaren wir einen anderen Termin.",
        "Mit freundlichen Grüßen, K. Brandt",
      ],
    },
    questions: [
      { prompt: "Warum schreibt Herr Brandt?", options: ["Die Miete steigt.", "Die Heizung wird kontrolliert.", "Frau Yilmaz muss umziehen."], answer: 1, explanation: "Die Heizung wird „gewartet“, also kontrolliert und repariert." },
      { prompt: "Was soll Frau Yilmaz tun?", options: ["Am Dienstag zu Hause sein.", "Den Techniker anrufen.", "Die Heizung abstellen."], answer: 0, explanation: "„Sorgen Sie dafür, dass … jemand in der Wohnung ist.“" },
      { prompt: "Bis wann soll sie anrufen, wenn sie keine Zeit hat?", options: ["Bis Dienstag.", "Bis Freitag.", "Bis 12 Uhr."], answer: 1, explanation: "„rufen Sie mich bitte bis Freitag an“." },
    ],
    more: { href: "/mock-test", label: "Probeprüfung ansehen" },
    landing: "dtz-b1-vorbereitung",
  },
  {
    slug: "grammatik-nebensaetze",
    title: "Deutsche Grammatik: Nebensätze üben",
    description: "Nebensätze mit weil, obwohl, dass und wenn üben: Übung mit Lösungen und kurzen Erklärungen für B1.",
    h1: "Deutsche Grammatik – Nebensätze üben",
    intro: "Im Nebensatz steht das konjugierte Verb am Ende. Wähle die richtige Form.",
    instructions: "Wähle den korrekten Satz oder die richtige Konjunktion.",
    questions: [
      { prompt: "Ich bleibe zu Hause, ___ ich krank bin.", options: ["weil", "obwohl", "damit"], answer: 0, explanation: "„weil“ nennt einen Grund." },
      { prompt: "Er geht spazieren, ___ es regnet.", options: ["weil", "obwohl", "dass"], answer: 1, explanation: "„obwohl“ nennt einen Gegengrund." },
      { prompt: "Welcher Satz ist richtig?", options: ["Ich weiß, dass er kommt morgen.", "Ich weiß, dass er morgen kommt.", "Ich weiß, dass kommt er morgen."], answer: 1, explanation: "Im Nebensatz mit „dass“ steht das Verb am Ende." },
      { prompt: "Welcher Satz ist richtig?", options: ["Wenn ich Zeit habe, rufe ich dich an.", "Wenn ich Zeit habe, ich rufe dich an.", "Wenn ich habe Zeit, rufe ich dich an."], answer: 0, explanation: "Nach dem Nebensatz steht im Hauptsatz zuerst das Verb: „rufe ich“." },
      { prompt: "Sie lernt Deutsch, ___ sie in Deutschland arbeiten kann.", options: ["damit", "weil", "obwohl"], answer: 0, explanation: "„damit“ nennt das Ziel einer Handlung." },
    ],
    more: { href: "/learn/grammar", label: "Grammatik-Lektionen ansehen" },
    landing: "deutsche-grammatik",
  },
  {
    slug: "wortschatz-b1",
    title: "Deutsch Wortschatz B1: Übung mit Lösungen",
    description: "Wortschatz-Übung für B1: Verben mit Präpositionen und Nomen-Verb-Verbindungen, mit Lösungen und Erklärungen.",
    h1: "Deutsch Wortschatz B1 – Übung",
    intro: "Verben mit Präpositionen und feste Wendungen musst du als Ganzes lernen. Teste dich.",
    instructions: "Wähle die passende Präposition oder das passende Wort.",
    questions: [
      { prompt: "Ich warte ___ den Bus.", options: ["auf", "für", "an"], answer: 0, explanation: "„warten auf + Akkusativ“." },
      { prompt: "Sie interessiert sich ___ Musik.", options: ["für", "auf", "über"], answer: 0, explanation: "„sich interessieren für + Akkusativ“." },
      { prompt: "Wir müssen eine Entscheidung ___.", options: ["machen", "treffen", "geben"], answer: 1, explanation: "Die feste Verbindung heißt „eine Entscheidung treffen“." },
      { prompt: "Er hat mir einen Termin ___.", options: ["vereinbart", "bekommt", "gespielt"], answer: 0, explanation: "„einen Termin vereinbaren“ bedeutet, einen Termin festzulegen." },
      { prompt: "Ich ärgere mich ___ den Lärm.", options: ["über", "auf", "von"], answer: 0, explanation: "„sich ärgern über + Akkusativ“." },
    ],
    more: { href: "/learn/expressions", label: "Mehr Wortschatz üben" },
    landing: "deutscher-wortschatz",
  },
];

export const getSampleExercise = (slug: string) => SAMPLE_EXERCISES.find((e) => e.slug === slug);
