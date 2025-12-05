package com.deutschbridge.backend.model.enums;

import lombok.Getter;

@Getter
public enum LearningLevel
{
    A1 ("Level A1"),
    A2 ("Level A2"),
    B1 ("Level B1"),
    B2 ("Level B2"),
    C1 ("Level C1"),
    C2 ("Level C2"),;

    private final String value;

    LearningLevel(String value) { this.value = value; }

}
