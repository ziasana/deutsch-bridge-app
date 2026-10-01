package com.deutschbridge.backend.model.enums;

import lombok.Getter;

/** Communicative function of a Redemittel. The label is what learners see (served by the API, not hard-coded in the UI). */
@Getter
public enum WritingPhraseCategory {
    GREETING("Anrede"),
    INTRODUCTION("Einleitung"),
    OPINION("Meinung äußern"),
    REASON("Begründen"),
    EXAMPLE("Beispiele geben"),
    ADDITION("Ergänzen"),
    CONTRAST("Vergleichen / Gegensatz"),
    AGREEMENT("Zustimmen"),
    DISAGREEMENT("Widersprechen"),
    ADVANTAGE_DISADVANTAGE("Vor- und Nachteile"),
    SUGGESTION("Vorschläge machen"),
    REQUEST("Bitten"),
    APOLOGY("Entschuldigen"),
    QUESTION("Nach Informationen fragen"),
    CONCLUSION("Schluss");

    private final String label;

    WritingPhraseCategory(String label) {
        this.label = label;
    }
}
