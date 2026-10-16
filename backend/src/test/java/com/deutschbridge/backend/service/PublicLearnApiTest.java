package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.GrammarCategory;
import com.deutschbridge.backend.model.entity.GrammarLesson;
import com.deutschbridge.backend.model.entity.QuizQuestion;
import com.deutschbridge.backend.model.enums.GrammarLessonStatus;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.GrammarCategoryRepository;
import com.deutschbridge.backend.repository.GrammarLessonRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The public "try it free" area: open without login, first lesson of a category free, the rest locked and never served. */
@Testcontainers
@SpringBootTest(properties = {"notifications.scheduler.enabled=false", "exam.simulation.seed-default-profile=false"})
@ActiveProfiles("test")
@AutoConfigureMockMvc
class PublicLearnApiTest {

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;
    @Autowired private GrammarCategoryRepository categoryRepository;
    @Autowired private GrammarLessonRepository lessonRepository;

    private GrammarCategory category;
    private GrammarLesson free;
    private GrammarLesson locked;

    @AfterEach
    void cleanUp() {
        if (free != null) lessonRepository.delete(free);
        if (locked != null) lessonRepository.delete(locked);
        if (category != null) categoryRepository.delete(category);
    }

    private GrammarLesson lesson(String title, int order) {
        GrammarLesson l = new GrammarLesson();
        l.setTitle(title);
        l.setSummary("Summary " + title);
        l.setContent("Full text of " + title);
        l.setLevel(LearningLevel.A2);
        l.setStatus(GrammarLessonStatus.PUBLISHED);
        l.setCategory(category);
        l.setSortOrder(order);
        QuizQuestion q = new QuizQuestion();
        q.setType("mcq");
        q.setQuestion("Which?");
        q.setOptions(List.of("a", "b"));
        q.setAnswer("a");
        l.setQuiz(List.of(q));
        return lessonRepository.save(l);
    }

    private JsonNode body(String url) throws Exception {
        return json.readTree(mvc.perform(get(url)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }

    @Test
    @DisplayName("Grammar: the first lesson of a category is free and served in full, the others are locked and answer 403")
    void grammarFreeAndLocked() throws Exception {
        category = new GrammarCategory();
        category.setTitle("Public test category");
        category.setLevel(LearningLevel.A2);
        category = categoryRepository.save(category);
        free = lesson("First lesson", 0);
        locked = lesson("Second lesson", 1);

        JsonNode view = body("/api/public/learn/grammar?level=A2");
        JsonNode lessons = null;
        for (JsonNode c : view.get("categories")) if (category.getId().equals(c.get("id").asText())) lessons = c.get("lessons");
        assertNotNull(lessons, "the category is listed");
        assertEquals(2, lessons.size());
        assertTrue(lessons.get(0).get("free").asBoolean());
        assertFalse(lessons.get(1).get("free").asBoolean());
        assertEquals("Second lesson", lessons.get(1).get("title").asText(), "a locked lesson is still listed by title");
        assertFalse(lessons.get(1).has("content"), "the list never carries lesson content");
        assertTrue(lessons.get(1).get("summary").isNull(), "a locked lesson is only a title");
        assertEquals("Summary First lesson", lessons.get(0).get("summary").asText(), "a free lesson keeps its summary");

        JsonNode full = body("/api/public/learn/grammar/" + free.getId());
        assertEquals("Full text of First lesson", full.get("content").asText());
        assertEquals(1, full.get("quiz").size());

        mvc.perform(get("/api/public/learn/grammar/" + locked.getId())).andExpect(status().isForbidden());
        mvc.perform(get("/api/public/learn/grammar/does-not-exist")).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Public answers may be cached by browsers and CDNs for a few minutes, per Accept-Language")
    void cachingHeaders() throws Exception {
        var res = mvc.perform(get("/api/public/learn/overview")).andExpect(status().isOk()).andReturn().getResponse();
        assertTrue(res.getHeader("Cache-Control").contains("max-age=300"), "max-age is set");
        assertTrue(res.getHeader("Cache-Control").contains("public"), "marked public");
        assertTrue(res.getHeaders("Vary").stream().anyMatch(v -> v.contains("Accept-Language")), "varies by language");
        String refused = mvc.perform(get("/api/public/learn/grammar/does-not-exist")).andExpect(status().isForbidden()).andReturn().getResponse().getHeader("Cache-Control");
        assertTrue(refused == null || !refused.contains("public"), "a refusal is never marked cacheable");
    }

    @Test
    @DisplayName("The sample lists carry the real total next to the capped sample")
    void sampleListsReportRealTotals() throws Exception {
        for (String url : List.of("/api/public/learn/redemittel", "/api/public/learn/expressions?type=REDEWENDUNG&level=B1", "/api/public/learn/reading?level=A1")) {
            JsonNode page = body(url);
            assertEquals(40, page.get("sampleLimit").asInt());
            assertTrue(page.get("total").asLong() >= page.get("totalElements").asLong(), "the sample never claims more than the library holds");
            assertTrue(page.get("totalElements").asLong() <= page.get("total").asLong());
        }
    }

    @Test
    @DisplayName("At most the sample size is kept per group, and each group is capped on its own")
    void sampleCapIsPerGroup() {
        java.util.List<String> items = new java.util.ArrayList<>();
        for (int i = 0; i < 45; i++) items.add("a" + i);
        for (int i = 0; i < 3; i++) items.add("b" + i);
        var kept = PublicLearnService.firstPerGroup(items, s -> s.substring(0, 1), s -> s, PublicLearnService.SAMPLE_PER_GROUP);
        assertEquals(43, kept.size(), "40 of the large group and all 3 of the small one");
        assertTrue(kept.contains("a0") && kept.contains("a39") && !kept.contains("a40"));
    }

    @Test
    @DisplayName("The overview, redemittel, expressions and reading lists answer without a login")
    void listsAreOpen() throws Exception {
        assertTrue(body("/api/public/learn/overview").has("grammar"));
        assertTrue(body("/api/public/learn/redemittel").has("items"));
        assertTrue(body("/api/public/learn/expressions?type=REDEWENDUNG&level=B1").has("items"));
        assertTrue(body("/api/public/learn/reading?level=A1").has("items"));
    }

    @Test
    @DisplayName("Only the first entries of each group stay free")
    void firstPerGroup() {
        var free = PublicLearnService.firstPerGroup(List.of("a1", "a2", "b1", "a3", "b2"), s -> s.substring(0, 1), s -> s, 1);
        assertEquals(java.util.Set.of("a1", "b1"), free);
        var two = PublicLearnService.firstPerGroup(List.of("a1", "a2", "b1", "a3", "b2"), s -> s.substring(0, 1), s -> s, 2);
        assertEquals(java.util.Set.of("a1", "a2", "b1", "b2"), two);
    }

    @Test
    @DisplayName("A tappable word keeps its stored position only when the text there is that word; a small shift is corrected, a miss is dropped")
    void alignsNotes() {
        String text = "Lieber Ben, viele Grüße aus Berlin!";
        int start = text.indexOf("Grüße");
        assertArrayEquals(new int[]{start, start + 5}, PublicLearnService.align(text, start, start + 5, "Grüße"));
        assertArrayEquals(new int[]{start, start + 5}, PublicLearnService.align(text, start - 2, start + 3, "Grüße"), "shifted two characters");
        assertNull(PublicLearnService.align(text, 0, 5, "Wetter"), "a word that is not nearby is dropped");
        assertNull(PublicLearnService.align(text, 99, 120, "Grüße"), "out of range");
    }

    @Test
    @DisplayName("Reading and Redemittel open two items per level; the overview and the lists agree")
    void twoFreePerLevel() throws Exception {
        JsonNode overview = body("/api/public/learn/overview");
        for (String kind : List.of("reading", "redemittel")) {
            for (JsonNode level : overview.get(kind)) {
                assertTrue(level.get("free").asLong() <= PublicLearnService.FREE_PER_LEVEL, kind + " " + level.get("level").asText());
                assertEquals(Math.min(PublicLearnService.FREE_PER_LEVEL, level.get("total").asLong()), level.get("free").asLong());
            }
        }
    }

    @Test
    @DisplayName("Practice of a Redemittel or expression that is not free answers 403")
    void practiceOfLockedItemsIsForbidden() throws Exception {
        mvc.perform(get("/api/public/learn/redemittel/nope/exercises")).andExpect(status().isForbidden());
        mvc.perform(get("/api/public/learn/expressions/nope/practice")).andExpect(status().isForbidden());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/public/learn/redemittel/nope/answer")
                .contentType("application/json").content("{\"exerciseId\":\"auto:FUNCTION\",\"answer\":\"x\"}")).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("AI-graded practice of a locked expression answers 403 before any AI check is used")
    void aiPracticeOfLockedExpressionIsForbidden() throws Exception {
        var post = org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/public/learn/expressions/nope/practice/production")
                .contentType("application/json").content("{\"sentence\":\"Ein Satz.\"}");
        for (int i = 0; i < PublicLearnService.AI_CHECKS_PER_HOUR + 2; i++) mvc.perform(post).andExpect(status().isForbidden());
    }
}
