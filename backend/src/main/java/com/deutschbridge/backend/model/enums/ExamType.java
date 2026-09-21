package com.deutschbridge.backend.model.enums;

import lombok.Getter;

@Getter
public enum ExamType
{
    TELC ("TELC"),
    GOETHE ("Goethe"),
    TESTDAF ("TestDaF"),
    DSH ("DSH"),
    OTHER ("Other");

    private final String value;

    ExamType(String value) { this.value = value; }
}
