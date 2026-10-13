package com.deutschbridge.backend.service.examcontent;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** The saved topic list of a content generator, against a real PostgreSQL (Testcontainers). */
@Testcontainers
@SpringBootTest(properties = "notifications.scheduler.enabled=false")
@ActiveProfiles("test")
@Transactional
class ExamGeneratorTopicServiceIntegrationTest {

    @Autowired private ExamGeneratorTopicService service;

    @Test
    @DisplayName("an added topic is saved for its part only, once, and removed again")
    void addAndRemoveCustomTopics() {
        assertEquals(List.of(), service.list("DTZ_TEIL_5").custom());
        service.add("DTZ_TEIL_5", "  Umzug   in eine neue Stadt ");
        service.add("DTZ_TEIL_5", "umzug in eine neue stadt");
        var topics = service.add("DTZ_TEIL_5", "Schwimmbad");
        assertEquals(List.of("Umzug in eine neue Stadt", "Schwimmbad"), topics.custom());
        assertEquals(List.of(), service.list("DTZ_TEIL_4").custom(), "other parts keep their own list");

        assertEquals(List.of("Schwimmbad"), service.remove("DTZ_TEIL_5", "UMZUG IN EINE NEUE STADT").custom());
        assertEquals(List.of(), service.remove("DTZ_TEIL_5", "Schwimmbad").custom());
    }

    @Test
    @DisplayName("a built-in topic is hidden by removing it, can be brought back one by one or all at once")
    void hideAndRestoreBuiltInTopics() {
        service.setHidden("DTZ_TEIL_4", "housing", true);
        service.setHidden("DTZ_TEIL_4", "HOUSING", true);
        assertEquals(List.of("HOUSING", "PUBLIC_SERVICES").size(), service.setHidden("DTZ_TEIL_4", "PUBLIC_SERVICES", true).hidden().size());
        assertEquals(List.of("PUBLIC_SERVICES"), service.setHidden("DTZ_TEIL_4", "HOUSING", false).hidden());
        assertEquals(List.of(), service.restoreBuiltIn("DTZ_TEIL_4").hidden());
    }

    @Test
    @DisplayName("blank, too long or malformed input is rejected")
    void rejectsBadInput() {
        assertThrows(IllegalArgumentException.class, () -> service.add("DTZ_TEIL_5", "  "));
        assertThrows(IllegalArgumentException.class, () -> service.add("DTZ_TEIL_5", "x".repeat(61)));
        assertThrows(IllegalArgumentException.class, () -> service.add("dtz teil 5", "Thema"));
        assertThrows(IllegalArgumentException.class, () -> service.setHidden("DTZ_TEIL_5", "not a token!", true));
    }
}
