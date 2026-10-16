package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.entity.KeyVocabularyItem;
import com.deutschbridge.backend.model.entity.QuizQuestion;
import com.deutschbridge.backend.model.entity.ReadingQuizQuestion;
import com.deutschbridge.backend.model.enums.RedemittelContext;
import com.deutschbridge.backend.model.enums.WritingFormality;

import java.util.List;

/**
 * Shapes of the public "try it free" learning area. They mirror what the learner dashboard lists, but carry no user data
 * and no content for locked items: a locked item is only a title, so a visitor sees what exists without reading it.
 * A free item is the first of its category; its full content is served by the matching detail endpoint. Redemittel, expression and reading
 * lists are a sample: each level and topic lists at most {@code SAMPLE_PER_GROUP} entries, while every count is the real one.
 */
public final class PublicLearnDtos {

    private PublicLearnDtos() {
    }

    public record LevelCount(String level, long total, long free) {
    }

    /** Per-level totals of the four content types, for the level selectors and the landing page. */
    public record Overview(List<LevelCount> grammar, List<LevelCount> redemittel, List<LevelCount> expressions, List<LevelCount> reading) {
    }

    // ---- grammar

    public record GrammarLessonItem(String id, String title, String titleFa, String summary, String summaryFa, String level, int quizCount, boolean free) {
    }

    public record GrammarCategoryItem(String id, String title, String titleFa, String level, List<GrammarLessonItem> lessons) {
    }

    public record GrammarLevelView(String level, List<GrammarCategoryItem> categories, List<GrammarLessonItem> uncategorized) {
    }

    public record GrammarFull(String id, String title, String titleFa, String summary, String summaryFa, String content, String contentFa, String example,
                              String exampleFa, String usageTips, String usageTipsFa, String videoLink, String level, String categoryTitle,
                              List<QuizQuestion> quiz) {
    }

    // ---- redemittel

    public record Category(String key, String label, long count) {
    }

    /** Locked items carry only id, level, category and phrase; every other field is null. */
    public record Phrase(String id, String level, String category, String categoryLabel, String phrase, boolean free, String meaning, String explanation,
                         String example, WritingFormality formality, String usageNote, String grammarPattern, String commonMistake,
                         List<String> similarExpressions, List<RedemittelContext> contexts) {
    }

    /**
     * A page of the sample listing. {@code totalElements} and {@code totalPages} describe the sample (at most {@code sampleLimit} entries
     * per level and topic); {@code total} is the real number of entries in the library for the same filter, so the page can say
     * "showing a sample" without ever understating the library.
     */
    public record PhrasePage(List<Phrase> items, int page, int size, long totalElements, int totalPages, List<Category> categories, long total, int sampleLimit) {
    }

    // ---- expressions

    /** Locked items carry only id, expression, level and image. */
    public record ExpressionItem(String id, String expression, String level, boolean free, String meaningDe, String meaningEn, String register, String imageUrl,
                                 String exampleSentence) {
    }

    public record ExpressionPage(List<ExpressionItem> items, int page, int size, long totalElements, int totalPages, long total, int sampleLimit) {
    }

    public record ExpressionExample(String sentence, String translationEn, String translationFa) {
    }

    public record ExpressionPattern(String pattern, String grammarCase, String preposition, String example) {
    }

    public record ExpressionFull(String id, String type, String level, String expression, String meaningDe, String meaningEn, String meaningFa,
                                 String literalMeaning, String figurativeMeaning, String grammarNote, String usageNote, String register,
                                 String commonMistakes, String imageUrl, List<ExpressionExample> examples, List<ExpressionPattern> patterns) {
    }

    // ---- reading

    /** Locked items carry only id, title, topic, level and picture. */
    public record ArticleItem(String id, String title, String categoryId, String categoryTitle, String level, String imageUrl, String thumbnailUrl, boolean free) {
    }

    public record ArticlePage(List<ArticleItem> items, int page, int size, long totalElements, int totalPages, List<Category> categories, long total, int sampleLimit) {
    }

    /** A tappable word of an article: where it sits in the text and what it means. */
    public record Note(int start, int end, String surfaceText, String lemma, String pos, String gender, String translationEn, String exampleSentence) {
    }

    public record ArticleFull(String id, String title, String level, String categoryTitle, String imageUrl, String content, List<Note> notes,
                              List<KeyVocabularyItem> keyVocabulary, List<ReadingQuizQuestion> quiz) {
    }
}
