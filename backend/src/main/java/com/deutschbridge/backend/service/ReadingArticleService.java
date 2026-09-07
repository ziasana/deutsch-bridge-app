package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ReadingArticleManualRequest;
import com.deutschbridge.backend.model.dto.ReadingArticleResponse;
import com.deutschbridge.backend.model.entity.Annotation;
import com.deutschbridge.backend.model.entity.KeyVocabularyItem;
import com.deutschbridge.backend.model.entity.LearningProgress;
import com.deutschbridge.backend.model.entity.ReadingArticle;
import com.deutschbridge.backend.model.entity.ReadingQuizQuestion;
import com.deutschbridge.backend.model.entity.Span;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserWordProgress;
import com.deutschbridge.backend.model.enums.AnnotationType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.ReadingQuizQuestionType;
import com.deutschbridge.backend.repository.LearningProgressRepository;
import com.deutschbridge.backend.repository.ReadingArticleRepository;
import com.deutschbridge.backend.repository.UserWordProgressRepository;
import com.deutschbridge.backend.util.ReadingArticleMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ReadingArticleService {

    private static final String NOT_FOUND_MSG = "Reading article not found!";
    private static final String TITLE_MARKER = "TITEL:";
    private static final String TEXT_MARKER = "TEXT:";
    private static final String VOCAB_MARKER = "VOKABELN:";
    private static final String ANNOTATIONS_MARKER = "ANNOTATIONS:";
    private static final String QUIZ_MARKER = "QUIZ:";

    private final ReadingArticleRepository readingArticleRepository;
    private final LearningProgressRepository learningProgressRepository;
    private final UserWordProgressRepository userWordProgressRepository;
    private final UserService userService;
    private final RequestContext requestContext;
    private final OllamaService ollamaService;
    private final TokenizationService tokenizationService;

    public ReadingArticleService(ReadingArticleRepository readingArticleRepository,
                                  LearningProgressRepository learningProgressRepository,
                                  UserWordProgressRepository userWordProgressRepository,
                                  UserService userService,
                                  RequestContext requestContext,
                                  OllamaService ollamaService,
                                  TokenizationService tokenizationService) {
        this.readingArticleRepository = readingArticleRepository;
        this.learningProgressRepository = learningProgressRepository;
        this.userWordProgressRepository = userWordProgressRepository;
        this.userService = userService;
        this.requestContext = requestContext;
        this.ollamaService = ollamaService;
        this.tokenizationService = tokenizationService;
    }

    public ReadingArticle findById(String id) throws DataNotFoundException {
        return readingArticleRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
    }

    public List<ReadingArticleResponse> findAllWithLearningProgress() {
        return mapWithCurrentUserProgress(readingArticleRepository.findAll());
    }

    public List<ReadingArticleResponse> findByLevelWithLearningProgress(LearningLevel level) {
        return mapWithCurrentUserProgress(readingArticleRepository.findByLevel(level));
    }

    public ReadingArticleResponse findByIdWithLearningProgress(String id) throws DataNotFoundException {
        ReadingArticle article = findById(id);
        return mapWithCurrentUserProgress(List.of(article)).get(0);
    }

    private List<ReadingArticleResponse> mapWithCurrentUserProgress(List<ReadingArticle> articles) {
        if (articles.isEmpty()) return List.of();

        User user = userService.findByEmail(requestContext.getUserEmail());
        List<LearningProgress> progresses = learningProgressRepository.findByUserAndReadingIn(user, articles);
        Map<String, LearningProgress> progressByArticleId = progresses.stream()
                .collect(Collectors.toMap(p -> p.getReading().getId(), p -> p, (first, second) -> first));

        List<String> lemmas = articles.stream()
                .flatMap(a -> a.getAnnotations() != null ? a.getAnnotations().stream() : java.util.stream.Stream.empty())
                .map(Annotation::getLemma)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();
        Set<String> knownLemmas = lemmas.isEmpty()
                ? Set.of()
                : userWordProgressRepository.findByUserAndLemmaIn(user, lemmas).stream()
                .filter(p -> p.getStatus() == com.deutschbridge.backend.model.enums.WordProgressStatus.KNOWN)
                .map(UserWordProgress::getLemma)
                .collect(Collectors.toSet());

        return articles.stream()
                .map(a -> ReadingArticleMapper.mapToResponse(a, progressByArticleId.get(a.getId()), knownLemmas))
                .toList();
    }

    public ReadingArticleResponse generate(String topic, LearningLevel level) {
        String raw = ollamaService.generateReadingArticle(topic, level);
        ParsedArticle parsed = parseGeneratedArticle(raw);

        ReadingArticle article = new ReadingArticle();
        article.setTitle(parsed.title());
        article.setTopic(topic);
        article.setLevel(level);
        article.setContent(parsed.text());
        article.setKeyVocabulary(parsed.vocabulary());
        article.setTokens(tokenizationService.tokenize(parsed.text()));

        return ReadingArticleMapper.mapToResponse(readingArticleRepository.save(article), null, Set.of());
    }

    public List<KeyVocabularyItem> suggestVocabulary(String content, LearningLevel level) {
        String raw = ollamaService.extractKeyVocabulary(content, level);
        return parseVocabulary(raw);
    }

    public List<Annotation> suggestAnnotations(String content, LearningLevel level) {
        String raw = ollamaService.generateAnnotations(content, level);
        return parseAnnotations(raw, content);
    }

    public List<ReadingQuizQuestion> generateQuiz(String content, LearningLevel level, List<Annotation> annotations) {
        String raw = ollamaService.generateReadingQuiz(content, level);
        return parseQuiz(raw, annotations != null ? annotations : List.of());
    }

    /**
     * Admin-only: the quiz's correct answers/explanations are deliberately left out of the
     * student-facing reading response (see ReadingArticleMapper) so they can't be inspected
     * before an attempt, but the admin content-review UI needs the full questions to edit them.
     */
    public List<ReadingQuizQuestion> getQuizForAdmin(String id) throws DataNotFoundException {
        ReadingArticle article = findById(id);
        return article.getQuiz() != null ? article.getQuiz() : new ArrayList<>();
    }

    public ReadingArticleResponse createManual(ReadingArticleManualRequest request) {
        ReadingArticle article = new ReadingArticle();
        article.setTitle(request.title());
        article.setTopic(request.topic());
        article.setLevel(request.level());
        article.setContent(request.content());
        article.setKeyVocabulary(request.keyVocabulary() != null ? request.keyVocabulary() : new ArrayList<>());
        article.setAnnotations(prepareAnnotations(request.annotations(), article.getContent()));
        article.setQuiz(prepareQuiz(request.quiz()));
        article.setLinkedGroupId(request.linkedGroupId());
        article.setTokens(tokenizationService.tokenize(article.getContent()));

        return ReadingArticleMapper.mapToResponse(readingArticleRepository.save(article), null, Set.of());
    }

    public ReadingArticleResponse update(String id, ReadingArticleManualRequest request) throws DataNotFoundException {
        ReadingArticle existing = findById(id);

        boolean contentChanged = request.content() != null && !request.content().equals(existing.getContent());

        if (request.title() != null) existing.setTitle(request.title());
        if (request.topic() != null) existing.setTopic(request.topic());
        if (request.level() != null) existing.setLevel(request.level());
        if (request.content() != null) existing.setContent(request.content());
        if (request.keyVocabulary() != null) existing.setKeyVocabulary(request.keyVocabulary());
        if (request.annotations() != null) existing.setAnnotations(prepareAnnotations(request.annotations(), existing.getContent()));
        if (request.quiz() != null) existing.setQuiz(prepareQuiz(request.quiz()));
        if (request.linkedGroupId() != null) existing.setLinkedGroupId(request.linkedGroupId());
        if (contentChanged || existing.getTokens() == null) {
            existing.setTokens(tokenizationService.tokenize(existing.getContent()));
        }

        return ReadingArticleMapper.mapToResponse(readingArticleRepository.save(existing), null, Set.of());
    }

    public void delete(String id) throws DataNotFoundException {
        findById(id);
        readingArticleRepository.deleteById(id);
    }

    private List<Annotation> prepareAnnotations(List<Annotation> annotations, String content) {
        if (annotations == null) return new ArrayList<>();
        for (Annotation annotation : annotations) {
            annotation.ensureId();
            if ((annotation.getSpans() == null || annotation.getSpans().isEmpty())
                    && content != null && annotation.getSurfaceText() != null && !annotation.getSurfaceText().isBlank()) {
                annotation.setSpans(locateSpans(content, annotation.getSurfaceText()));
            }
        }
        return annotations;
    }

    private List<ReadingQuizQuestion> prepareQuiz(List<ReadingQuizQuestion> quiz) {
        if (quiz == null) return new ArrayList<>();
        quiz.forEach(ReadingQuizQuestion::ensureId);
        return quiz;
    }

    private ParsedArticle parseGeneratedArticle(String raw) {
        int titleIdx = raw.indexOf(TITLE_MARKER);
        int textIdx = raw.indexOf(TEXT_MARKER);
        int vocabIdx = raw.indexOf(VOCAB_MARKER);

        String title = titleIdx >= 0 && textIdx > titleIdx
                ? raw.substring(titleIdx + TITLE_MARKER.length(), textIdx).trim()
                : "";
        String text = textIdx >= 0
                ? raw.substring(textIdx + TEXT_MARKER.length(), vocabIdx >= 0 ? vocabIdx : raw.length()).trim()
                : raw.trim();
        List<KeyVocabularyItem> vocabulary = vocabIdx >= 0
                ? parseVocabulary(raw.substring(vocabIdx))
                : List.of();

        return new ParsedArticle(title, text, vocabulary);
    }

    private List<KeyVocabularyItem> parseVocabulary(String vocabSection) {
        int vocabIdx = vocabSection.indexOf(VOCAB_MARKER);
        String lines = vocabIdx >= 0 ? vocabSection.substring(vocabIdx + VOCAB_MARKER.length()) : vocabSection;

        List<KeyVocabularyItem> items = new ArrayList<>();
        for (String line : lines.split("\\r?\\n")) {
            String trimmed = line.trim();
            if (trimmed.isEmpty() || !trimmed.startsWith("-")) continue;

            String withoutBullet = trimmed.substring(1).trim();
            int colonIdx = withoutBullet.indexOf(':');
            if (colonIdx < 0) continue;

            String word = withoutBullet.substring(0, colonIdx).trim();
            String meaning = withoutBullet.substring(colonIdx + 1).trim();
            if (!word.isEmpty() && !meaning.isEmpty()) {
                items.add(new KeyVocabularyItem(word, meaning));
            }
        }
        return items;
    }

    List<Annotation> parseAnnotations(String raw, String content) {
        int idx = raw.indexOf(ANNOTATIONS_MARKER);
        String lines = idx >= 0 ? raw.substring(idx + ANNOTATIONS_MARKER.length()) : raw;

        List<Annotation> result = new ArrayList<>();
        for (String line : lines.split("\\r?\\n")) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;

            String[] parts = trimmed.split("\\|");
            if (parts.length < 3) continue;

            AnnotationType type = switch (parts[0].trim().toUpperCase()) {
                case "WORD" -> AnnotationType.WORD;
                case "NVV" -> AnnotationType.NOMEN_VERB_VERBINDUNG;
                case "REDEWENDUNG" -> AnnotationType.REDEWENDUNG;
                default -> null;
            };
            if (type == null) continue;

            Annotation annotation = new Annotation();
            annotation.setType(type);
            annotation.setSurfaceText(field(parts, 1));
            annotation.setLemma(field(parts, 2) != null ? field(parts, 2) : field(parts, 1));

            switch (type) {
                case WORD -> {
                    annotation.setPos(field(parts, 3));
                    annotation.setGender(field(parts, 4));
                    annotation.setPluralForm(field(parts, 5));
                    annotation.setTranslationEn(field(parts, 6));
                    annotation.setCefrLevel(parseLevel(field(parts, 7)));
                    annotation.setExampleSentence(field(parts, 8));
                }
                case NOMEN_VERB_VERBINDUNG -> {
                    annotation.setTranslationEn(field(parts, 6));
                    annotation.setCefrLevel(parseLevel(field(parts, 7)));
                    annotation.setExampleSentence(field(parts, 8));
                }
                case REDEWENDUNG -> {
                    annotation.setTranslationEn(field(parts, 6));
                    annotation.setLiteralTranslation(field(parts, 7));
                    annotation.setCefrLevel(parseLevel(field(parts, 8)));
                    annotation.setExampleSentence(field(parts, 9));
                }
            }

            if (annotation.getSurfaceText() == null || annotation.getSurfaceText().isBlank()) continue;

            annotation.setSpans(locateSpans(content, annotation.getSurfaceText()));
            annotation.ensureId();
            result.add(annotation);
        }
        return result;
    }

    List<ReadingQuizQuestion> parseQuiz(String raw, List<Annotation> annotations) {
        int idx = raw.indexOf(QUIZ_MARKER);
        String lines = idx >= 0 ? raw.substring(idx + QUIZ_MARKER.length()) : raw;

        List<ReadingQuizQuestion> result = new ArrayList<>();
        for (String line : lines.split("\\r?\\n")) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;

            String[] parts = trimmed.split("\\|");
            if (parts.length < 6) continue;

            ReadingQuizQuestionType type;
            try {
                type = ReadingQuizQuestionType.valueOf(parts[0].trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                continue;
            }

            String optionsRaw = field(parts, 2);
            List<String> options = optionsRaw == null
                    ? List.of()
                    : Arrays.stream(optionsRaw.split(";")).map(String::trim).filter(s -> !s.isEmpty()).toList();

            ReadingQuizQuestion question = new ReadingQuizQuestion();
            question.setType(type);
            question.setPrompt(field(parts, 1));
            question.setOptions(options);
            question.setCorrectAnswer(field(parts, 3));
            question.setExplanation(field(parts, 4));
            question.setSupportingSentence(field(parts, 5));
            question.setMinLevel(type == ReadingQuizQuestionType.INFERENCE ? LearningLevel.B1 : LearningLevel.A1);

            if (type == ReadingQuizQuestionType.VOCAB_CONTEXT) {
                String relatedLemma = field(parts, 6);
                if (relatedLemma != null) {
                    annotations.stream()
                            .filter(a -> relatedLemma.equalsIgnoreCase(a.getLemma()))
                            .findFirst()
                            .ifPresent(a -> question.setRelatedAnnotationId(a.getId()));
                }
            }

            if (question.getPrompt() == null || question.getPrompt().isBlank()) continue;

            question.ensureId();
            result.add(question);
        }
        return result;
    }

    private List<Span> locateSpans(String content, String surfaceText) {
        int idx = indexOfIgnoreCase(content, surfaceText, 0);
        if (idx >= 0) {
            return new ArrayList<>(List.of(new Span(idx, idx + surfaceText.length())));
        }

        List<Span> spans = new ArrayList<>();
        int searchFrom = 0;
        for (String token : surfaceText.split("\\s+")) {
            if (token.isBlank()) continue;
            int tokenIdx = indexOfIgnoreCase(content, token, searchFrom);
            if (tokenIdx < 0) continue;
            spans.add(new Span(tokenIdx, tokenIdx + token.length()));
            searchFrom = tokenIdx + token.length();
        }
        return spans;
    }

    private int indexOfIgnoreCase(String haystack, String needle, int from) {
        return haystack.toLowerCase().indexOf(needle.toLowerCase(), Math.max(from, 0));
    }

    private String field(String[] parts, int i) {
        if (i >= parts.length) return null;
        String value = parts[i].trim();
        return value.isEmpty() || value.equals("-") ? null : value;
    }

    private LearningLevel parseLevel(String value) {
        if (value == null) return null;
        try {
            return LearningLevel.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private record ParsedArticle(String title, String text, List<KeyVocabularyItem> vocabulary) {
    }
}
