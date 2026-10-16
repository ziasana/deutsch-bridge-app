package com.deutschbridge.backend.model.enums;

import lombok.Getter;

@Getter
public enum ExamType
{
    TELC ("TELC"),
    GOETHE ("Goethe"),
    TESTDAF ("TestDaF"),
    /** Deutsch-Test für Zuwanderer, A2-B1. Its exercises are stored with level B1. */
    DTZ ("DTZ A2-B1"),
    DSH ("DSH"),
    OTHER ("Other");

    private final String value;

    ExamType(String value) { this.value = value; }
}
