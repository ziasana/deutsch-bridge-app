package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.model.dto.ExamContentDtos.PromptRequest;
import com.deutschbridge.backend.model.dto.ExamContentDtos.PromptResponse;
import com.deutschbridge.backend.model.enums.ExamContentStatus;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ExamContentPromptBuilderTest {

    private final ExamContentPromptBuilder builder = new ExamContentPromptBuilder();
    private final ExamContentSpec spec = ExamContentSpecs.all().get(0);

    private PromptRequest request(int count, String difficulty, List<String> topics) {
        return new PromptRequest("TELC", "B1", "LESEN", "TEIL_1", count, difficulty, topics, null);
    }

    @Test
    void promptContainsCountDistributionAndNoUnresolvedPlaceholders() {
        PromptResponse r = builder.build(spec, request(20, "MIXED", List.of("ENVIRONMENT", "WORK", "TRAVEL", "EVERYDAY_LIFE", "HEALTH")), 37, 38);
        assertTrue(r.prompt().contains("Generate exactly 20 exercise sets"));
        assertTrue(r.prompt().contains("approximately 4 ENVIRONMENT"));
        assertTrue(r.prompt().contains("approximately 4 EASY, 12 MEDIUM, 4 HARD"));
        assertTrue(r.prompt().contains("B1-L1-038"));
        assertTrue(r.prompt().contains("Return ONLY valid JSON"));
        assertTrue(r.prompt().contains("Do NOT use code fences"));
        assertFalse(r.prompt().contains("{{"), "unresolved placeholder");
        assertEquals("1.0", r.promptVersion());
    }

    @Test
    void topicsAreSpreadIncludingRemainder() {
        PromptResponse r = builder.build(spec, request(7, "HARD", List.of("WORK", "HEALTH", "TRAVEL")), 0, 1);
        assertTrue(r.prompt().contains("approximately 3 WORK"));
        assertTrue(r.prompt().contains("approximately 2 HEALTH"));
        assertTrue(r.prompt().contains("all exercises HARD"));
    }

    @Test
    void jsonExampleMatchesTheValidatorsSchema() throws Exception {
        PromptResponse r = builder.build(spec, request(1, "MEDIUM", List.of()), 0, 1);
        var root = new com.fasterxml.jackson.databind.ObjectMapper().readTree(r.jsonExample());
        assertEquals(10, root.get("exercises").get(0).get("headings").size());
        assertEquals(5, root.get("exercises").get(0).get("texts").size());
        assertTrue(ExamImportParser.parse(r.jsonExample()).ok());
    }

    @Test
    void rejectsBadParameters() {
        assertThrows(IllegalArgumentException.class, () -> builder.build(spec, request(0, "MIXED", List.of()), 0, 1));
        assertThrows(IllegalArgumentException.class, () -> builder.build(spec, request(5, "EXTREME", List.of()), 0, 1));
        assertThrows(IllegalArgumentException.class, () -> builder.build(spec, request(5, "MIXED", List.of("NOPE")), 0, 1));
    }

    @Test
    void nextNumberContinuesAfterTheHighestExistingId() {
        assertEquals(1, ExamContentPromptBuilder.nextNumber("B1-L1-", List.of()));
        assertEquals(38, ExamContentPromptBuilder.nextNumber("B1-L1-", List.of("B1-L1-037", "B1-L1-002", "B2-L1-099")));
    }

    @Test
    void statusWorkflowOnlyAllowsReviewedContentToBePublished() {
        assertFalse(ExamContentStatus.DRAFT.canMoveTo(ExamContentStatus.PUBLISHED));
        assertFalse(ExamContentStatus.REVIEW.canMoveTo(ExamContentStatus.PUBLISHED));
        assertTrue(ExamContentStatus.APPROVED.canMoveTo(ExamContentStatus.PUBLISHED));
        assertTrue(ExamContentStatus.PUBLISHED.canMoveTo(ExamContentStatus.ARCHIVED));
        assertTrue(ExamContentStatus.ARCHIVED.canMoveTo(ExamContentStatus.DRAFT));
    }
}
