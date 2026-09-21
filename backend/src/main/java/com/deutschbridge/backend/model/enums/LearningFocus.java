package com.deutschbridge.backend.model.enums;

import lombok.Getter;

@Getter
public enum LearningFocus
{
    VOCABULARY ("Vocabulary"),
    GRAMMAR ("Grammar"),
    SPEAKING ("Speaking"),
    LISTENING ("Listening"),
    READING ("Reading"),
    WRITING ("Writing"),
    EXPRESSIONS ("Expressions"),
    EXAM ("Exam Skills");

    private final String value;

    LearningFocus(String value) { this.value = value; }
}
