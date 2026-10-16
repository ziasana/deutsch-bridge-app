package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.LanguageContext;
import com.deutschbridge.backend.model.dto.PublicLearnDtos.*;
import com.deutschbridge.backend.model.entity.*;
import com.deutschbridge.backend.model.enums.ExpressionType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.WritingPhraseRepository;
import com.deutschbridge.backend.service.cache.ContentCacheService;
import com.deutschbridge.backend.service.cache.RedemittelCacheService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.*;

/**
 * The public "try it free" learning area. It reads the same shared, cached content the learner dashboard lists, and decides
 * what a visitor may open: the first item of every category (the first two expressions of a collection) is free and served in
 * full; everything else is listed by title only. Nothing here is per user, so it is safe without a login.
 */
@Service
public class PublicLearnService {

    static final int FREE_PER_CATEGORY = 1;
    static final int FREE_EXPRESSIONS = 2;
    /** The most entries one level and topic lists on the public pages; the free ones are always among them. */
    static final int SAMPLE_PER_GROUP = 40;
    private static final int ALL = 1000;
    private static final long TTL_MS = 10 * 60 * 1000L;

    private final ContentCacheService content;
    private final RedemittelCacheService redemittelCache;
    private final WritingPhraseRepository phraseRepository;
    private final Clock clock;

    private Overview overview;
    private long overviewAt;
    private PhraseSnapshot phrases;
    private long phrasesAt;

    public PublicLearnService(ContentCacheService content, RedemittelCacheService redemittelCache, WritingPhraseRepository phraseRepository, Clock clock) {
        this.content = content;
        this.redemittelCache = redemittelCache;
        this.phraseRepository = phraseRepository;
        this.clock = clock;
    }

    /** The ids that stay free in each group: the first {@code free} entries, in the order the list shows them. */
    static <T> Set<String> firstPerGroup(List<T> ordered, java.util.function.Function<T, Object> group, java.util.function.Function<T, String> id, int free) {
        Map<Object, Integer> seen = new HashMap<>();
        Set<String> ids = new HashSet<>();
        for (T item : ordered) {
            int n = seen.merge(group.apply(item), 1, Integer::sum);
            if (n <= free) ids.add(id.apply(item));
        }
        return ids;
    }


    /** One zero-based page of a list, with the number of pages it needs. */
    private static <T> List<T> pageOf(List<T> list, int page, int size) {
        int from = Math.min(Math.max(0, page) * size, list.size());
        return list.subList(from, Math.min(from + size, list.size()));
    }

    private static int pagesFor(int count, int size) {
        return (count + size - 1) / size;
    }

    /** Every active Redemittel in list order, with the ids that are free and the ids that belong to the sample. */
    private record PhraseSnapshot(List<WritingPhrase> ordered, Set<String> sample, Map<String, String> freeLevelById) {
    }

    // ---------------------------------------------------------------- overview

    public synchronized Overview overview() {
        long now = clock.millis();
        if (overview == null || now - overviewAt > TTL_MS) {
            overview = buildOverview();
            overviewAt = now;
        }
        return overview;
    }

    private Overview buildOverview() {
        List<LevelCount> grammar = new ArrayList<>();
        List<LevelCount> redemittel = new ArrayList<>();
        List<LevelCount> expressions = new ArrayList<>();
        List<LevelCount> reading = new ArrayList<>();
        PhraseSnapshot snapshot = phraseSnapshot();
        for (LearningLevel level : LearningLevel.values()) {
            ContentCacheService.GrammarLevelContent g = content.getGrammarLevelContent(level);
            long gTotal = g.uncategorized().size() + g.categories().stream().mapToLong(c -> c.lessons().size()).sum();
            long gFree = Math.min(FREE_PER_CATEGORY, g.uncategorized().size())
                    + g.categories().stream().mapToLong(c -> Math.min(FREE_PER_CATEGORY, c.lessons().size())).sum();
            grammar.add(new LevelCount(level.getValue(), gTotal, gFree));

            long rTotal = snapshot.ordered().stream().filter(p -> p.getLevel() == level).count();
            long rFree = snapshot.freeLevelById().values().stream().filter(l -> l.equals(level.getValue())).count();
            redemittel.add(new LevelCount(level.getValue(), rTotal, rFree));

            long eTotal = 0;
            long eFree = 0;
            for (ExpressionType type : ExpressionType.values()) {
                long n = content.getExpressionListPage(type, level, "", 0, 1).totalElements();
                eTotal += n;
                eFree += Math.min(FREE_EXPRESSIONS, n);
            }
            expressions.add(new LevelCount(level.getValue(), eTotal, eFree));

            List<ContentCacheService.ReadingArticleListEntry> articles = content.getReadingArticleListPage(level, "", null, 0, ALL).entries();
            reading.add(new LevelCount(level.getValue(), articles.size(), readingFree(articles).size()));
        }
        return new Overview(grammar, redemittel, expressions, reading);
    }

    // ---------------------------------------------------------------- grammar

    public GrammarLevelView grammar(LearningLevel level) {
        ContentCacheService.GrammarLevelContent c = content.getGrammarLevelContent(level);
        List<GrammarCategoryItem> categories = c.categories().stream()
                .map(cat -> new GrammarCategoryItem(cat.id(), cat.title(), cat.titleFa(), cat.level() == null ? null : cat.level().getValue(), lessons(cat.lessons())))
                .toList();
        return new GrammarLevelView(level.getValue(), categories, lessons(c.uncategorized()));
    }

    private static List<GrammarLessonItem> lessons(List<ContentCacheService.GrammarLessonEntry> entries) {
        List<GrammarLessonItem> out = new ArrayList<>();
        for (int i = 0; i < entries.size(); i++) {
            ContentCacheService.GrammarLessonEntry e = entries.get(i);
            boolean free = i < FREE_PER_CATEGORY;
            // A locked lesson is only a title: its summary is part of what signing up opens.
            out.add(new GrammarLessonItem(e.id(), e.title(), e.titleFa(), free ? e.summary() : null, free ? e.summaryFa() : null, e.level().getValue(), e.quizCount(), free));
        }
        return out;
    }

    /** The full lesson, or empty when it does not exist or is not one of the free ones. */
    @Transactional(readOnly = true)
    public Optional<GrammarFull> grammarLesson(String id) {
        Optional<GrammarLesson> found = content.getPublishedGrammarLesson(id);
        if (found.isEmpty()) return Optional.empty();
        GrammarLesson l = found.get();
        com.deutschbridge.backend.model.entity.GrammarCategory category = l.getCategory();
        LearningLevel level = category != null && category.getLevel() != null ? category.getLevel() : l.getLevel();
        ContentCacheService.GrammarLevelContent c = content.getGrammarLevelContent(level);
        List<ContentCacheService.GrammarLessonEntry> siblings = category == null ? c.uncategorized()
                : c.categories().stream().filter(cat -> cat.id().equals(category.getId())).findFirst().map(ContentCacheService.GrammarCategoryEntry::lessons).orElse(List.of());
        boolean free = siblings.stream().limit(FREE_PER_CATEGORY).anyMatch(e -> e.id().equals(id));
        if (!free) return Optional.empty();
        return Optional.of(new GrammarFull(l.getId(), l.getTitle(), l.getTitleFa(), l.getSummary(), l.getSummaryFa(), l.getContent(), l.getContentFa(), l.getExample(),
                l.getExampleFa(), l.getUsageTips(), l.getUsageTipsFa(), l.getVideoLink(), l.getLevel().getValue(), category == null ? null : category.getTitle(),
                l.getQuiz() == null ? List.of() : l.getQuiz()));
    }

    // ---------------------------------------------------------------- redemittel

    private synchronized PhraseSnapshot phraseSnapshot() {
        long now = clock.millis();
        if (phrases == null || now - phrasesAt > TTL_MS) {
            List<WritingPhrase> all = new ArrayList<>(phraseRepository.findByActiveTrue());
            all.sort(Comparator.comparing(WritingPhrase::getLevel).thenComparingInt((WritingPhrase p) -> p.getCategory() == null ? 0 : p.getCategory().getSortOrder())
                    .thenComparingInt(WritingPhrase::getSortOrder));
            java.util.function.Function<WritingPhrase, Object> bucket = p -> p.getLevel() + "|" + (p.getCategory() == null ? "" : p.getCategory().getId());
            Set<String> free = firstPerGroup(all, bucket, WritingPhrase::getId, FREE_PER_CATEGORY);
            Set<String> sample = firstPerGroup(all, bucket, WritingPhrase::getId, SAMPLE_PER_GROUP);
            Map<String, String> freeLevelById = new LinkedHashMap<>();
            for (WritingPhrase p : all) if (free.contains(p.getId())) freeLevelById.put(p.getId(), p.getLevel().getValue());
            phrases = new PhraseSnapshot(List.copyOf(all), sample, freeLevelById);
            phrasesAt = now;
        }
        return phrases;
    }

    @Transactional(readOnly = true)
    public PhrasePage redemittel(LearningLevel level, String category, int page, int size) {
        int pageSize = Math.max(1, Math.min(size, 50));
        String key = category == null || category.isBlank() ? null : category;
        PhraseSnapshot snapshot = phraseSnapshot();
        List<WritingPhrase> scope = snapshot.ordered().stream()
                .filter(p -> (level == null || p.getLevel() == level) && (key == null || (p.getCategory() != null && key.equals(p.getCategory().getId())))).toList();
        List<WritingPhrase> sample = scope.stream().filter(p -> snapshot.sample().contains(p.getId())).toList();
        String language = LanguageContext.get();
        List<Phrase> items = pageOf(sample, page, pageSize).stream().map(ph -> phrase(ph, snapshot.freeLevelById().containsKey(ph.getId()), language)).toList();
        List<Category> categories = redemittelCache.getHubContent().categories().stream().map(c -> new Category(c.key(), c.label(), c.count())).toList();
        return new PhrasePage(items, Math.max(0, page), pageSize, sample.size(), pagesFor(sample.size(), pageSize), categories, scope.size(), SAMPLE_PER_GROUP);
    }

    private static Phrase phrase(WritingPhrase p, boolean free, String language) {
        String key = p.getCategory() == null ? null : p.getCategory().getId();
        String label = p.getCategory() == null ? null : p.getCategory().getLabel();
        if (!free) return new Phrase(p.getId(), p.getLevel().getValue(), key, label, p.getPhrase(), false, null, null, null, null, null, null, null, null, null);
        com.deutschbridge.backend.model.dto.RedemittelDto d = RedemittelService.toDto(p, null, false, language);
        return new Phrase(p.getId(), p.getLevel().getValue(), key, label, p.getPhrase(), true, d.meaning(), d.explanation(), d.example(), d.formality(), d.usageNote(),
                d.grammarPattern(), d.commonMistake(), d.similarExpressions(), d.contexts());
    }

    // ---------------------------------------------------------------- expressions

    private Set<String> freeExpressions(ExpressionType type, LearningLevel level) {
        return content.getExpressionListPage(type, level, "", 0, ALL).entries().stream().limit(FREE_EXPRESSIONS).map(ContentCacheService.ExpressionListEntry::id)
                .collect(java.util.stream.Collectors.toSet());
    }

    public ExpressionPage expressions(ExpressionType type, LearningLevel level, int page, int size) {
        int pageSize = Math.max(1, Math.min(size, 50));
        List<ContentCacheService.ExpressionListEntry> whole = content.getExpressionListPage(type, level, "", 0, ALL).entries();
        List<ContentCacheService.ExpressionListEntry> sample = whole.subList(0, Math.min(SAMPLE_PER_GROUP, whole.size()));
        Set<String> free = whole.stream().limit(FREE_EXPRESSIONS).map(ContentCacheService.ExpressionListEntry::id).collect(java.util.stream.Collectors.toSet());
        List<ExpressionItem> items = pageOf(sample, page, pageSize).stream().map(e -> free.contains(e.id())
                ? new ExpressionItem(e.id(), e.expression(), e.level().getValue(), true, e.meaningDe(), e.meaningEn(), e.register() == null ? null : e.register().name(), e.imageUrl(), e.exampleSentence())
                : new ExpressionItem(e.id(), e.expression(), e.level().getValue(), false, null, null, null, e.imageUrl(), null)).toList();
        return new ExpressionPage(items, Math.max(0, page), pageSize, sample.size(), pagesFor(sample.size(), pageSize), whole.size(), SAMPLE_PER_GROUP);
    }

    @Transactional(readOnly = true)
    public Optional<ExpressionFull> expression(String id) {
        Optional<Expression> found = content.getExpressionDetail(id);
        if (found.isEmpty()) return Optional.empty();
        Expression e = found.get();
        if (e.getStatus() != com.deutschbridge.backend.model.enums.ExpressionStatus.PUBLISHED || !freeExpressions(e.getType(), e.getLevel()).contains(id)) return Optional.empty();
        return Optional.of(new ExpressionFull(e.getId(), e.getType() == null ? null : e.getType().name(), e.getLevel() == null ? null : e.getLevel().getValue(), e.getExpression(),
                e.getMeaningDe(), e.getMeaningEn(), e.getMeaningFa(), e.getLiteralMeaning(), e.getFigurativeMeaning(), e.getGrammarNote(), e.getUsageNote(),
                e.getRegister() == null ? null : e.getRegister().name(), e.getCommonMistakes(), e.getImageUrl(),
                e.getExamples().stream().map(x -> new com.deutschbridge.backend.model.dto.PublicLearnDtos.ExpressionExample(x.getSentence(), x.getTranslationEn(), x.getTranslationFa())).toList(),
                e.getPatterns().stream().map(x -> new com.deutschbridge.backend.model.dto.PublicLearnDtos.ExpressionPattern(x.getPattern(), x.getGrammarCase(), x.getPreposition(), x.getExample())).toList()));
    }

    // ---------------------------------------------------------------- reading

    private static Set<String> readingFree(List<ContentCacheService.ReadingArticleListEntry> level) {
        return firstPerGroup(level, a -> a.categoryId() == null ? "" : a.categoryId(), ContentCacheService.ReadingArticleListEntry::id, FREE_PER_CATEGORY);
    }

    public ArticlePage reading(LearningLevel level, String categoryId, int page, int size) {
        int pageSize = Math.max(1, Math.min(size, 50));
        String key = categoryId == null || categoryId.isBlank() ? null : categoryId;
        List<ContentCacheService.ReadingArticleListEntry> whole = content.getReadingArticleListPage(level, "", null, 0, ALL).entries();
        Set<String> free = readingFree(whole);
        Set<String> inSample = firstPerGroup(whole, a -> a.categoryId() == null ? "" : a.categoryId(), ContentCacheService.ReadingArticleListEntry::id, SAMPLE_PER_GROUP);
        List<ContentCacheService.ReadingArticleListEntry> scope = whole.stream().filter(a -> key == null || key.equals(a.categoryId())).toList();
        List<ContentCacheService.ReadingArticleListEntry> sample = scope.stream().filter(a -> inSample.contains(a.id())).toList();
        List<ArticleItem> items = pageOf(sample, page, pageSize).stream().map(a -> new ArticleItem(a.id(), a.title(), a.categoryId(), a.categoryTitle(), a.level().getValue(),
                a.imageUrl(), a.thumbnailUrl(), free.contains(a.id()))).toList();
        Map<String, Category> byCategory = new LinkedHashMap<>();
        for (ContentCacheService.ReadingArticleListEntry a : whole) {
            if (a.categoryId() == null) continue;
            byCategory.merge(a.categoryId(), new Category(a.categoryId(), a.categoryTitle(), 1), (x, y) -> new Category(x.key(), x.label(), x.count() + 1));
        }
        return new ArticlePage(items, Math.max(0, page), pageSize, sample.size(), pagesFor(sample.size(), pageSize), new ArrayList<>(byCategory.values()), scope.size(), SAMPLE_PER_GROUP);
    }

    /**
     * The stored position of a tappable word is only trusted when the text there really is that word. Some articles were stored with
     * positions shifted by a few characters; then the word is looked for right next to where it should be, and a word that cannot be
     * found there is left out instead of highlighting the wrong letters.
     */
    static int[] align(String content, int start, int end, String surface) {
        if (content == null || surface == null || surface.isBlank()) return null;
        int length = content.length();
        if (start >= 0 && end <= length && start < end && content.substring(start, end).equals(surface)) return new int[]{start, end};
        int from = Math.max(0, start - 8);
        int at = content.indexOf(surface, from);
        if (at >= 0 && at <= start + 8) return new int[]{at, at + surface.length()};
        return null;
    }

    @Transactional(readOnly = true)
    public Optional<ArticleFull> article(String id) {
        Optional<ReadingArticle> found = content.getReadingArticle(id);
        if (found.isEmpty()) return Optional.empty();
        ReadingArticle a = found.get();
        if (!readingFree(content.getReadingArticleListPage(a.getLevel(), "", null, 0, ALL).entries()).contains(id)) return Optional.empty();
        List<Note> notes = new ArrayList<>();
        for (Annotation n : a.getAnnotations() == null ? List.<Annotation>of() : a.getAnnotations()) {
            if (n.getSpans() == null || n.getSpans().isEmpty() || n.getTranslationEn() == null || n.getTranslationEn().isBlank()) continue;
            Span span = n.getSpans().get(0);
            int[] at = align(a.getContent(), span.getStart(), span.getEnd(), n.getSurfaceText());
            if (at == null) continue;
            notes.add(new Note(at[0], at[1], n.getSurfaceText(), n.getLemma(), n.getPos(), n.getGender(), n.getTranslationEn(), n.getExampleSentence()));
        }
        notes.sort(Comparator.comparingInt(Note::start));
        return Optional.of(new ArticleFull(a.getId(), a.getTitle(), a.getLevel().getValue(), a.getCategory() == null ? null : a.getCategory().getTitle(), a.getImageUrl(),
                a.getContent(), notes, a.getKeyVocabulary() == null ? List.of() : a.getKeyVocabulary(), a.getQuiz() == null ? List.of() : a.getQuiz()));
    }
}
