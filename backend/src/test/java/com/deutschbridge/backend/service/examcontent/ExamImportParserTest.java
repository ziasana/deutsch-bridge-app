package com.deutschbridge.backend.service.examcontent;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ExamImportParserTest {

    @Test
    void parsesPlainJson() {
        assertTrue(ExamImportParser.parse("{\"a\": 1}").ok());
        assertTrue(ExamImportParser.parse("﻿  {\"a\": 1}  \n").ok());
    }

    @Test
    void rejectsMarkdownFencesWithoutRepairingThem() {
        var result = ExamImportParser.parse("```json\n{\"a\": 1}\n```");
        assertFalse(result.ok());
        assertTrue(result.error().contains("remove Markdown code fences"));
    }

    @Test
    void rejectsTextAroundTheJson() {
        assertTrue(ExamImportParser.parse("Here is your JSON: {\"a\": 1}").error().contains("must start with '{'"));
        assertFalse(ExamImportParser.parse("{\"a\": 1} Viel Erfolg!").ok());
    }

    @Test
    void reportsSyntaxErrorsWithPosition() {
        var result = ExamImportParser.parse("{\n  \"a\": 1,\n  \"b\": \n}");
        assertFalse(result.ok());
        assertTrue(result.error().contains("line"));
    }

    @Test
    void rejectsDuplicateKeysAndEmptyInput() {
        assertFalse(ExamImportParser.parse("{\"a\": 1, \"a\": 2}").ok());
        assertFalse(ExamImportParser.parse("  ").ok());
        assertFalse(ExamImportParser.parse(null).ok());
    }
}
