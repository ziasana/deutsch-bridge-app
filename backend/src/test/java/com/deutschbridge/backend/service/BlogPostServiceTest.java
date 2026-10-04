package com.deutschbridge.backend.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class BlogPostServiceTest {

    @Test
    void slugifyTransliteratesGermanAndStripsPunctuation() {
        assertEquals("5-haeufige-fehler-fuer-lerner-so-geht-s",
                BlogPostService.slugify("5 häufige Fehler für Lerner – so geht's!"));
    }

    @Test
    void slugifyFallsBackWhenNothingUsable() {
        assertEquals("post", BlogPostService.slugify("???"));
    }

    @Test
    void readingMinutesRoundsUpAndNeverBelowOne() {
        assertEquals(1, BlogPostService.readingMinutes(""));
        assertEquals(1, BlogPostService.readingMinutes("kurz"));
        assertEquals(2, BlogPostService.readingMinutes("wort ".repeat(201)));
    }
}
