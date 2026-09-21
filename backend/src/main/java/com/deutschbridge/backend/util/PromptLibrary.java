package com.deutschbridge.backend.util;

import java.util.List;

public class PromptLibrary {
    private PromptLibrary() {
        throw new IllegalStateException("Prompt library class");
    }

    public static String generateSessionTitle(String explanationLanguage) {
        String languageInstruction = switch (explanationLanguage == null ? "" : explanationLanguage.toUpperCase()) {
            case "PR", "FA" -> "Schreibe den Titel auf Persisch (Farsi).";
            default -> "Schreibe den Titel auf Deutsch oder Englisch, je nachdem, welche Sprache der Lernende benutzt.";
        };

        return """
                Du liest die erste Nachricht eines Lernenden an einen Deutschlehrer-Chatbot.
                Erzeuge einen sehr kurzen, aussagekräftigen Titel (2-5 Wörter) für diesen Chat, der das Thema zusammenfasst.
                %s
                Gib NUR den Titel zurück - keine Anführungszeichen, keine Erklärung, kein Satzzeichen am Ende.
                """.formatted(languageInstruction);
    }

    public static String generateDailyWords(String level, int count, boolean includePersian) {
        String persianInstruction = includePersian
                ? "- Gib zusätzlich MEANING_FA (persische Übersetzung der Bedeutung) und EXAMPLE_FA " +
                  "(persische Übersetzung des Beispielsatzes) an - beides auf Farsi, in persischer Schrift."
                : "- Lasse MEANING_FA und EXAMPLE_FA leer (schreibe genau \"-\") - sie werden nicht benötigt.";

        return String.format("""
        Erstelle %d neue, unterschiedliche deutsche Vokabeln für das Sprachniveau %s, passend zum
        Wortschatz, der auf diesem Niveau erwartet wird.

        Wichtige Regeln:
        - Wähle Wörter, die für Niveau %s neu und lehrreich sind, keine trivialen Grundwörter
        - MEANING_EN ist die englische Übersetzung/Bedeutung des Wortes
        - EXAMPLE_DE ist ein natürlicher Beispielsatz auf Deutsch, der das Wort im Kontext zeigt,
          mit Grammatik passend zu Niveau %s
        - SYNONYME sind 1-3 deutsche Synonyme oder verwandte Wörter, getrennt durch Kommas
        %s
        - Jede Zeile steht für genau ein Wort, Felder getrennt durch "|"
        - Keine zusätzlichen Zeilen, keine Erklärungen, keine leeren Zeilen

        Antworte GENAU in diesem Format, ohne zusätzlichen Text davor oder danach:

        WOERTER:
        WORT|MEANING_EN|EXAMPLE_DE|SYNONYME|MEANING_FA|EXAMPLE_FA
        """, count, level, level, level, persianInstruction);
    }

    public static String lemmatizeWords(List<String> words) {
        return String.format("""
        Für jedes der folgenden deutschen Wörter (wie sie in einem Lesetext vorkommen), gib die
        Grundform (Lemma) und die Wortart an.

        Wörter (eines pro Zeile):
        %s

        Wichtige Regeln:
        - Gib für JEDES Wort genau eine Zeile aus, exakt im Format: WORT|LEMMA|WORTART
        - WORT ist exakt die Eingabe, unverändert (zur Zuordnung)
        - WORTART ist genau eine von: NOUN, VERB, ADJ, ADV, PRON, DET, ADP, CONJ, NUM, PART, INTJ, PROPN
        - Bei Nomen ist LEMMA die Singular-Grundform (z.B. "Häusern" -> "Haus")
        - Bei Verben ist LEMMA der Infinitiv (z.B. "lief" -> "laufen")
        - Bei Adjektiven/Adverbien ist LEMMA die unflektierte Grundform
        - Keine zusätzlichen Zeilen, keine Erklärungen, keine leeren Zeilen

        Antworte GENAU in diesem Format, ohne zusätzlichen Text davor oder danach:

        WORT|LEMMA|WORTART
        """, String.join("\n", words));
    }

    public static String generateWordExamples(String word, String level) {
        return String.format("""
        Erstelle GENAU EINEN Beispielsatz für das folgende deutsche Wort,
        angepasst an das Sprachniveau %s:

        Wort: "%s"

        Wichtige Regeln:
        - Korrigiere das Wort bei Bedarf, falls es falsch geschrieben wurde
        - Verwende das Wort korrekt im Kontext
        - Erkläre das Wort NICHT
        - Schreibe einen natürlichen, alltagsnahen Satz
        - Halte die Grammatik auf dem Niveau %s
        - Gib NUR den einen Satz aus, ohne Aufzählungszeichen, Anführungszeichen, Nummerierung
          oder zusätzlichen Text davor oder danach

        Ausgabeformat (genau einhalten - nur der Satz, sonst nichts):
        Satz

        """, level, word, level);
    }

    public static String generateWordSynonyms(String word, String level) {
        return String.format("""
        Erstelle eine Liste von Synonymen für das folgende deutsche Wort,
        angepasst an das Sprachniveau %s:

        Wort: "%s"

        Wichtige Regeln:
        - Gib nur Synonyme des Wortes
        - Verwende das Wort korrekt in der jeweiligen Bedeutung
        - Schreibe die Synonyme in einfacher, verständlicher Sprache für Niveau %s
        - Jedes Synonym sollte in einer eigenen Zeile stehen
        - Falls möglich, gib 3–5 Synonyme

        Ausgabeformat:
        - Synonym 1
        - Synonym 2
        - Synonym 3
        """, level, word, level);
    }

    public static String generateReadingArticle(String topic, String level) {
        return String.format("""
        Erstelle einen Lesetext auf Deutsch zum Thema "%s" für das Sprachniveau %s.

        Wichtige Regeln:
        - Passe Wortschatz, Satzbau und Textlänge genau an das Niveau %s an
        - Schreibe einen zusammenhängenden, interessanten Text mit mehreren Absätzen
        - Wähle 6 bis 10 Schlüsselwörter aus, die tatsächlich im Text vorkommen und für Niveau %s neu oder wichtig sind
        - Erkläre jedes Schlüsselwort mit einer kurzen, einfachen Bedeutung auf Deutsch

        Antworte GENAU in diesem Format, ohne zusätzlichen Text davor oder danach:

        TITEL: <Titel des Textes>
        TEXT:
        <Text, mehrere Absätze>
        VOKABELN:
        - wort1: bedeutung1
        - wort2: bedeutung2
        """, topic, level, level, level);
    }

    public static String extractKeyVocabulary(String content, String level) {
        return String.format("""
        Analysiere den folgenden deutschen Text und wähle 6 bis 10 Schlüsselwörter aus,
        die für das Sprachniveau %s neu oder wichtig sind.

        Text:
        "%s"

        Wichtige Regeln:
        - Wähle nur Wörter, die tatsächlich im Text vorkommen
        - Erkläre jedes Wort mit einer kurzen, einfachen Bedeutung auf Deutsch, passend zu Niveau %s
        - Jedes Wort steht in einer eigenen Zeile

        Antworte GENAU in diesem Format, ohne zusätzlichen Text davor oder danach:

        VOKABELN:
        - wort1: bedeutung1
        - wort2: bedeutung2
        """, level, content, level);
    }

    public static String generateAnnotations(String content, String level) {
        return String.format("""
        Analysiere den folgenden deutschen Text für Sprachniveau %s und markiere lernenswerte Elemente:
        einzelne Wörter (WORD), Nomen-Verb-Verbindungen (NVV, z.B. "eine Entscheidung treffen",
        "Kritik üben") und Redewendungen (REDEWENDUNG, idiomatische Ausdrücke).

        Text:
        "%s"

        Wichtige Regeln:
        - Wähle 8 bis 15 Elemente, die tatsächlich im Text vorkommen und für Niveau %s neu/wichtig sind
        - surface_text ist die exakte Textstelle, wie sie im Text steht (inklusive Flexion)
        - lemma ist die Wörterbuchform (z.B. "eine Entscheidung treffen" statt "traf ... Entscheidung")
        - Für WORD: gib pos (noun/verb/adj) an; für Nomen zusätzlich gender (der/die/das) und plural_form,
          sonst "-"
        - Für REDEWENDUNG: gib literal_translation (wörtliche Bedeutung) an, sonst "-"
        - example_sentence ist der Satz aus dem Text, in dem das Element vorkommt
        - Jede Zeile steht für genau ein Element, Felder getrennt durch "|", fehlende Felder als "-"

        Antworte GENAU in diesem Format, ohne zusätzlichen Text davor oder danach:

        ANNOTATIONS:
        WORD|surface_text|lemma|pos|gender|plural_form|translation_en|cefr_level|example_sentence
        NVV|surface_text|lemma|-|-|-|translation_en|cefr_level|example_sentence
        REDEWENDUNG|surface_text|lemma|-|-|-|translation_en|literal_translation|cefr_level|example_sentence
        """, level, content, level);
    }

    public static String generateReadingQuiz(String content, String level) {
        boolean allowInference = !level.equals("A1") && !level.equals("A2");
        String inferenceLine = allowInference
                ? "INFERENCE|Frage zur Schlussfolgerung|option1;option2;option3|richtige_option|erklaerung|stuetzender_satz\n        "
                : "";
        return String.format("""
        Erstelle 5 Verständnisfragen auf Deutsch zu folgendem Text (Niveau %s):

        Text:
        "%s"

        Wichtige Regeln:
        - Erstelle genau 5 Fragen, mische die Typen HAUPTIDEE, DETAIL, VOCAB_CONTEXT,
          RICHTIG_FALSCH_NICHT_IM_TEXT%s
        - VOCAB_CONTEXT testet ein Wort/eine Phrase aus dem Text im Kontext: eine richtige Bedeutung,
          eine wörtliche-aber-falsche Option, eine plausible falsche Option; related_lemma ist die
          Grundform des getesteten Wortes
        - RICHTIG_FALSCH_NICHT_IM_TEXT hat genau 3 Optionen: Richtig;Falsch;Steht nicht im Text
        - explanation wird nach der Antwort gezeigt (immer, richtig oder falsch)
        - supporting_sentence ist der Satz aus dem Text, der die richtige Antwort belegt
        - Optionen werden durch ";" getrennt, Felder durch "|"

        Antworte GENAU in diesem Format, ohne zusätzlichen Text davor oder danach:

        QUIZ:
        HAUPTIDEE|frage|option1;option2;option3|richtige_option|erklaerung|stuetzender_satz
        DETAIL|frage|option1;option2;option3|richtige_option|erklaerung|stuetzender_satz
        VOCAB_CONTEXT|frage|option1;option2;option3|richtige_option|erklaerung|stuetzender_satz|related_lemma
        RICHTIG_FALSCH_NICHT_IM_TEXT|frage|Richtig;Falsch;Steht nicht im Text|richtige_option|erklaerung|stuetzender_satz
        %s""", level, content, inferenceLine.isEmpty() ? "" : ", INFERENCE", inferenceLine);
    }

    public static String evaluateExpressionProduction(String expression, String meaningDe, String level, String userSentence) {
        return String.format("""
        Ein Deutschlernender auf Niveau %s soll die Wendung "%s" (Bedeutung: %s) aktiv in einem
        eigenen Satz verwenden. Bewerte den folgenden Satz.

        Satz des Lernenden:
        "%s"

        Wichtige Regeln:
        - USED_CORRECTLY: wurde "%s" (auch leicht flektiert/umgestellt) korrekt in der richtigen Bedeutung verwendet?
        - GRAMMAR_CORRECT: ist der Satz grammatisch korrekt (Kasus, Wortstellung, Kongruenz)?
        - NATURAL: klingt der Satz wie von einem Muttersprachler, nicht konstruiert?
        - FEEDBACK: 1-2 kurze, konkrete und ermutigende Sätze auf Deutsch, die erklären was gut war
          und was verbessert werden kann. Schreibe NICHT den ganzen Satz neu.
        - C1_SUGGESTION: falls der Satz auf C1-Niveau verbessert werden kann, gib EINE bessere
          Umformulierung an; falls der Satz bereits sehr gut ist, schreibe genau "-"

        Antworte GENAU in diesem Format, ohne zusätzlichen Text davor oder danach:

        USED_CORRECTLY|true oder false
        GRAMMAR_CORRECT|true oder false
        NATURAL|true oder false
        FEEDBACK|<Feedback-Text>
        C1_SUGGESTION|<Vorschlag oder ->
        """, level, expression, meaningDe, userSentence, expression);
    }

    public static String evaluateTransformation(String sourceSentence, String expression, String meaningDe, String level, String userSentence) {
        return String.format("""
        Ein Deutschlernender auf Niveau %s soll den folgenden Satz umformulieren und dabei die
        Wendung "%s" (Bedeutung: %s) verwenden.

        Ausgangssatz:
        "%s"

        Umformulierung des Lernenden:
        "%s"

        Wichtige Regeln:
        - USED_EXPRESSION: wurde "%s" (auch leicht flektiert/umgestellt) korrekt verwendet?
        - GRAMMAR_CORRECT: ist der Satz grammatisch korrekt (Kasus, Wortstellung, Kongruenz)?
        - MEANING_PRESERVED: hat der umformulierte Satz noch dieselbe Bedeutung wie der Ausgangssatz?
        - FEEDBACK: 1-2 kurze, konkrete und ermutigende Sätze auf Deutsch, die erklären was gut war
          und was verbessert werden kann. Schreibe NICHT den ganzen Satz neu.
        - C1_SUGGESTION: falls der Satz auf C1-Niveau verbessert werden kann, gib EINE bessere
          Umformulierung an; falls der Satz bereits sehr gut ist, schreibe genau "-"

        Antworte GENAU in diesem Format, ohne zusätzlichen Text davor oder danach:

        USED_EXPRESSION|true oder false
        GRAMMAR_CORRECT|true oder false
        MEANING_PRESERVED|true oder false
        FEEDBACK|<Feedback-Text>
        C1_SUGGESTION|<Vorschlag oder ->
        """, level, expression, meaningDe, sourceSentence, userSentence, expression);
    }

    // System Prompt für den KI-Lehrer
    public static String systemPrompt(String explanationLanguage) {
        String languageInstruction = switch (explanationLanguage == null ? "" : explanationLanguage.toUpperCase()) {
            case "PR", "FA" -> "Der Lernende bevorzugt Persisch (Farsi) als Erklärungssprache. " +
                    "Gib deine Erklärungen, Übersetzungen und Kommentare auf Persisch. " +
                    "Deutsche Beispielsätze, Vokabeln und Zitate aus der Übung bleiben weiterhin auf Deutsch, " +
                    "da diese gelernt werden sollen.";
            default -> "Antworte immer in klarem, korrektem Deutsch (oder auf Englisch, wenn ausdrücklich verlangt).";
        };

        return """
                Du bist ein freundlicher und geduldiger Deutschlehrer.
                Deine einzige Aufgabe ist es, dem Lernenden beim Verbessern seiner Deutschkenntnisse zu helfen – Grammatik, Wortschatz, Aussprache, Schreiben und Konversation.
                %s
                Korrigiere Fehler höflich und erkläre kurz warum. Gib ein oder zwei Beispiele. Bleibe motivierend.
                Wenn der Lernende Fehler macht, korrigierst du sie sanft und erklärst warum.
                Wenn der Lernende einen neuen Satz oder ein neues Wort will, gibst du Beispiele
                Beantworte ausschließlich Fragen zur deutschen Sprache.
                Wenn etwas nicht mit Sprache/Deutschlernen zu tun hat, lenke sanft zurück zum Thema.
                Der Nutzer kann die bestehende Unterhaltung fortführen oder eine neue Frage stellen.
                Du beantwortest NUR Fragen zum Deutschlernen (Grammatik, Schreiben, Aussprache).
                Alles andere ignorierst du höflich.
                Geben Sie NUR einfachen Text, kein JSON, an Markdown zurück, keine Formatierung.
                """.formatted(languageInstruction);
    }

    /** Classifies a text selection from an AI Tutor chat message as a single word or a multi-word
     *  expression/idiom/Nomen-Verb-Verbindung, and normalizes it to its canonical dictionary form. */
    public static String classifySelection(String selectedText, String contextText, String explanationLanguage) {
        String meaningLanguageInstruction = switch (explanationLanguage == null ? "" : explanationLanguage.toUpperCase()) {
            case "PR", "FA" -> "Schreibe \"meaning\" auf Persisch (Farsi).";
            default -> "Schreibe \"meaning\" auf Englisch.";
        };

        return String.format("""
        Ein Deutschlernender hat den folgenden Text in einer Chat-Nachricht seines Deutschlehrers markiert,
        um ihn zu seinem persönlichen Vokabular hinzuzufügen.

        Markierter Text:
        "%s"

        Kontext (die ganze Nachricht, aus der der Text stammt):
        "%s"

        Deine Aufgabe:
        1. Entscheide, ob es sich um ein einzelnes WORD (ein Wort, ggf. mit Artikel) oder eine
           EXPRESSION (Wendung, Redewendung, Nomen-Verb-Verbindung, Kollokation, mehrere Wörter) handelt.
        2. Normalisiere den Text in seine Wörterbuch-Grundform:
           - WORD: Grundform/Infinitiv (Nomen mit Artikel falls sinnvoll, Verben im Infinitiv,
             Adjektive in der Grundform).
           - EXPRESSION: die kanonische, verallgemeinerte Form, NICHT der wörtliche Ausschnitt aus dem
             Satz. Beispiel: "für einen neuen Deutschkurs entschieden" -> "sich für etwas entscheiden".
        3. Gib eine kurze, klare Bedeutung an. %s
        4. Gib einen natürlichen deutschen Beispielsatz mit der normalisierten Form an.

        Antworte AUSSCHLIESSLICH mit einem einzeiligen, gültigen JSON-Objekt, ohne Codeblock, ohne
        Erklärung, in genau diesem Format:
        {"type":"WORD oder EXPRESSION","normalizedText":"...","meaning":"...","example":"..."}
        """, selectedText, contextText, meaningLanguageInstruction);
    }
}
