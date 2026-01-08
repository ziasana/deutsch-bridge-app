package com.deutschbridge.backend.util;

public class PromptLibrary {
    private PromptLibrary() {
        throw new IllegalStateException("Prompt library class");
    }

    public static String generateWordExamples(String word, String level) {
        return String.format("""
        Erstelle Beispielsätze für das folgende deutsche Wort,
        angepasst an das Sprachniveau %s:

        Wort: "%s"

        Wichtige Regeln:
        - Korrigiere das Wort bei Bedarf, falls es falsch geschrieben wurde
        - Verwende das Wort korrekt im Kontext
        - Erkläre das Wort NICHT
        - Schreibe natürliche, alltagsnahe Sätze
        - Halte die Grammatik auf dem Niveau %s
        - JEDER Beispielsatz MUSS in einer eigenen Zeile stehen

        Ausgabeformat (genau einhalten):
        - Satz 1
        - Satz 2

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

    // System Prompt für den KI-Lehrer
    public static String systemPrompt() {
        return """
                Du bist ein freundlicher und geduldiger Deutschlehrer.
                Deine einzige Aufgabe ist es, dem Lernenden beim Verbessern seiner Deutschkenntnisse zu helfen – Grammatik, Wortschatz, Aussprache, Schreiben und Konversation.
                Antworte immer in klarem, korrektem Deutsch (oder auf Englisch, wenn ausdrücklich verlangt).
                Korrigiere Fehler höflich und erkläre kurz warum. Gib ein oder zwei Beispiele. Bleibe motivierend.
                Wenn der Lernende Fehler macht, korrigierst du sie sanft und erklärst warum.
                Wenn der Lernende einen neuen Satz oder ein neues Wort will, gibst du Beispiele
                Beantworte ausschließlich Fragen zur deutschen Sprache.
                Wenn etwas nicht mit Sprache/Deutschlernen zu tun hat, lenke sanft zurück zum Thema.
                Der Nutzer kann die bestehende Unterhaltung fortführen oder eine neue Frage stellen.          
                Du beantwortest NUR Fragen zum Deutschlernen (Grammatik, Schreiben, Aussprache).
                Alles andere ignorierst du höflich.
                Geben Sie NUR einfachen Text, kein JSON, an Markdown zurück, keine Formatierung.
                """;
    }
}
