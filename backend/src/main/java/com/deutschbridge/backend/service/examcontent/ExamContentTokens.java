package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;

import java.util.Locale;
import java.util.Optional;

/** Translates between the tokens used in import files ("LESEN", "TEIL_1", "DAFTEST" ...) and the app's enums. */
public final class ExamContentTokens {

    private ExamContentTokens() {
    }

    public static Optional<ExamType> parseExam(String token) {
        if (token == null) return Optional.empty();
        String t = token.trim().toUpperCase(Locale.ROOT).replace("-", "").replace("_", "").replace(" ", "");
        return switch (t) {
            case "TELC" -> Optional.of(ExamType.TELC);
            case "GOETHE" -> Optional.of(ExamType.GOETHE);
            case "TESTDAF", "DAFTEST" -> Optional.of(ExamType.TESTDAF);
            case "DSH" -> Optional.of(ExamType.DSH);
            case "OTHER" -> Optional.of(ExamType.OTHER);
            default -> Optional.empty();
        };
    }

    public static Optional<LearningLevel> parseLevel(String token) {
        if (token == null) return Optional.empty();
        try {
            return Optional.of(LearningLevel.valueOf(token.trim().toUpperCase(Locale.ROOT)));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public static Optional<ExamSection> parseSection(String token) {
        if (token == null) return Optional.empty();
        return switch (token.trim().toUpperCase(Locale.ROOT)) {
            case "LESEN", "LESEVERSTEHEN" -> Optional.of(ExamSection.LESEVERSTEHEN);
            case "SPRACHBAUSTEINE" -> Optional.of(ExamSection.SPRACHBAUSTEINE);
            case "HOEREN", "HÖREN", "HOERVERSTEHEN", "HÖRVERSTEHEN" -> Optional.of(ExamSection.HOERVERSTEHEN);
            case "SCHREIBEN", "SCHRIFTLICHER_AUSDRUCK" -> Optional.of(ExamSection.SCHRIFTLICHER_AUSDRUCK);
            case "SPRECHEN", "MUENDLICHER_AUSDRUCK", "MÜNDLICHER_AUSDRUCK" -> Optional.of(ExamSection.MUENDLICHER_AUSDRUCK);
            default -> Optional.empty();
        };
    }

    /** "TEIL_1" / "Teil 1" / "1" -> 1; empty if the token is not a Teil number. */
    public static Optional<Integer> parsePart(String token) {
        if (token == null) return Optional.empty();
        String t = token.trim().toUpperCase(Locale.ROOT).replace("TEIL", "").replace("_", "").replace(" ", "");
        try {
            int part = Integer.parseInt(t);
            return part > 0 ? Optional.of(part) : Optional.empty();
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    public static String sectionToken(ExamSection section) {
        return switch (section) {
            case LESEVERSTEHEN -> "LESEN";
            case HOERVERSTEHEN -> "HOEREN";
            case SCHRIFTLICHER_AUSDRUCK -> "SCHREIBEN";
            default -> section.name();
        };
    }

    public static String sectionLabel(ExamSection section) {
        return switch (section) {
            case LESEVERSTEHEN -> "Lesen";
            case HOERVERSTEHEN -> "Hören";
            case SCHRIFTLICHER_AUSDRUCK -> "Schreiben";
            case MUENDLICHER_AUSDRUCK -> "Mündlicher Ausdruck";
            case SPRACHBAUSTEINE -> "Sprachbausteine";
            default -> section.name();
        };
    }

    public static String sectionLetter(ExamSection section) {
        return switch (section) {
            case LESEVERSTEHEN -> "L";
            case HOERVERSTEHEN -> "H";
            case SCHRIFTLICHER_AUSDRUCK -> "S";
            case MUENDLICHER_AUSDRUCK -> "M";
            case SPRACHBAUSTEINE -> "SB";
            default -> "X";
        };
    }

    public static String partToken(int part) {
        return "TEIL_" + part;
    }
}
