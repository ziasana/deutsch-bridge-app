package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ReadingArticleManualRequest;
import com.deutschbridge.backend.model.dto.ReadingArticleResponse;
import com.deutschbridge.backend.model.entity.KeyVocabularyItem;
import com.deutschbridge.backend.model.entity.LearningProgress;
import com.deutschbridge.backend.model.entity.ReadingArticle;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.LearningProgressRepository;
import com.deutschbridge.backend.repository.ReadingArticleRepository;
import com.deutschbridge.backend.util.ReadingArticleMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReadingArticleService {

    private static final String NOT_FOUND_MSG = "Reading article not found!";
    private static final String TITLE_MARKER = "TITEL:";
    private static final String TEXT_MARKER = "TEXT:";
    private static final String VOCAB_MARKER = "VOKABELN:";

    private final ReadingArticleRepository readingArticleRepository;
    private final LearningProgressRepository learningProgressRepository;
    private final UserService userService;
    private final RequestContext requestContext;
    private final OllamaService ollamaService;

    public ReadingArticleService(ReadingArticleRepository readingArticleRepository,
                                  LearningProgressRepository learningProgressRepository,
                                  UserService userService,
                                  RequestContext requestContext,
                                  OllamaService ollamaService) {
        this.readingArticleRepository = readingArticleRepository;
        this.learningProgressRepository = learningProgressRepository;
        this.userService = userService;
        this.requestContext = requestContext;
        this.ollamaService = ollamaService;
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

        return articles.stream()
                .map(a -> ReadingArticleMapper.mapToResponse(a, progressByArticleId.get(a.getId())))
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

        return ReadingArticleMapper.mapToResponse(readingArticleRepository.save(article), null);
    }

    public List<KeyVocabularyItem> suggestVocabulary(String content, LearningLevel level) {
        String raw = ollamaService.extractKeyVocabulary(content, level);
        return parseVocabulary(raw);
    }

    public ReadingArticleResponse createManual(ReadingArticleManualRequest request) {
        ReadingArticle article = new ReadingArticle();
        article.setTitle(request.title());
        article.setTopic(request.topic());
        article.setLevel(request.level());
        article.setContent(request.content());
        article.setKeyVocabulary(request.keyVocabulary() != null ? request.keyVocabulary() : new ArrayList<>());

        return ReadingArticleMapper.mapToResponse(readingArticleRepository.save(article), null);
    }

    public ReadingArticleResponse update(String id, ReadingArticleManualRequest request) throws DataNotFoundException {
        ReadingArticle existing = findById(id);

        if (request.title() != null) existing.setTitle(request.title());
        if (request.topic() != null) existing.setTopic(request.topic());
        if (request.level() != null) existing.setLevel(request.level());
        if (request.content() != null) existing.setContent(request.content());
        if (request.keyVocabulary() != null) existing.setKeyVocabulary(request.keyVocabulary());

        return ReadingArticleMapper.mapToResponse(readingArticleRepository.save(existing), null);
    }

    public void delete(String id) throws DataNotFoundException {
        findById(id);
        readingArticleRepository.deleteById(id);
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

    private record ParsedArticle(String title, String text, List<KeyVocabularyItem> vocabulary) {
    }
}
