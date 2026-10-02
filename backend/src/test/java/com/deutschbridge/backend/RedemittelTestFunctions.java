package com.deutschbridge.backend;

import com.deutschbridge.backend.model.entity.RedemittelFunction;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** The built-in Redemittel functions (as created by migration V20) for tests. */
public final class RedemittelTestFunctions {

    public static final Map<String, String> LABELS = Map.ofEntries(
            Map.entry("GREETING", "Anrede"), Map.entry("INTRODUCTION", "Einleitung"), Map.entry("OPINION", "Meinung äußern"),
            Map.entry("REASON", "Begründen"), Map.entry("EXAMPLE", "Beispiele geben"), Map.entry("ADDITION", "Ergänzen"),
            Map.entry("CONTRAST", "Vergleichen / Gegensatz"), Map.entry("AGREEMENT", "Zustimmen"),
            Map.entry("DISAGREEMENT", "Widersprechen"), Map.entry("ADVANTAGE_DISADVANTAGE", "Vor- und Nachteile"),
            Map.entry("SUGGESTION", "Vorschläge machen"), Map.entry("REQUEST", "Bitten"), Map.entry("APOLOGY", "Entschuldigen"),
            Map.entry("QUESTION", "Nach Informationen fragen"), Map.entry("CONCLUSION", "Schluss"));

    private RedemittelTestFunctions() {
    }

    /** A function object with the built-in id and label (not persisted). */
    public static RedemittelFunction of(String id) {
        return new RedemittelFunction(id, LABELS.get(id), 0);
    }

    /** All built-in functions, sorted by id. */
    public static List<RedemittelFunction> all() {
        List<RedemittelFunction> list = new ArrayList<>();
        LABELS.keySet().stream().sorted().forEach(id -> list.add(of(id)));
        return list;
    }
}
