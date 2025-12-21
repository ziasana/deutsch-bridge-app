package com.deutschbridge.backend.model.enums;

import lombok.Getter;

@Getter
public enum LearningLevel
{
    A1 ("A1"),
    A2 ("A2"),
    B1 ("B1"),
    B2 ("B2"),
    C1 ("C1"),
    C2 ("C2"),;

    private final String value;

    LearningLevel(String value) { this.value = value; }

}
