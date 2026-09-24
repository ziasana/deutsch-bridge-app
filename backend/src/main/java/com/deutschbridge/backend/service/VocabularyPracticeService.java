package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.PracticeContextOptionDto;
import com.deutschbridge.backend.model.dto.PracticeContextQuestionDto;
import com.deutschbridge.backend.model.dto.PracticeVocabularyItemDto;
import com.deutschbridge.backend.model.dto.VocabularyPracticeSessionResponse;
import com.deutschbridge.backend.model.dto.VocabularyRoundRequest;
import com.deutschbridge.backend.model.dto.VocabularyRoundResponse;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.VocabularyItem;
import com.deutschbridge.backend.model.entity.VocabularyProgress;
import com.deutschbridge.backend.model.enums.LearningActivityType;
import com.deutschbridge.backend.model.enums.LearningModule;
import com.deutschbridge.backend.model.enums.VocabularyMasteryLevel;
import com.deutschbridge.backend.repository.VocabularyItemRepository;
import com.deutschbridge.backend.repository.VocabularyProgressRepository;
import com.deutschbridge.backend.util.VocabularyMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.function.Function;
import java.util.regex.Pattern;

/**
 * Drives the smaller, two-step vocabulary practice flow (flashcard recall + one context/MCQ step,
 * see the redesign plan) - modeled on ExpressionPracticeService but without admin-authored
 * questions: the context MCQ is built at read time from the item's own example sentence or from
 * other items in the user's pool as distractors (see generateContextQuestion).
 */
@Service
public class VocabularyPracticeService {

    private static final int SESSION_SIZE = 10;
    private static final double MIN_EASE_FACTOR = 1.3;
    private static final String[] OPTION_KEYS = {"A", "B", "C", "D"};

    private final VocabularyItemRepository vocabularyItemRepository;
    private final VocabularyProgressRepository vocabularyProgressRepository;
    private final UserService userService;
    private final RequestContext requestContext;
    private final LearningActivityService learningActivityService;

    public VocabularyPracticeService(VocabularyItemRepository vocabularyItemRepository,
                                      VocabularyProgressRepository vocabularyProgressRepository,
                                      UserService userService,
                                      RequestContext requestContext,
                                      LearningActivityService learningActivityService) {
        this.vocabularyItemRepository = vocabularyItemRepository;
        this.vocabularyProgressRepository = vocabularyProgressRepository;
        this.userService = userService;
        this.requestContext = requestContext;
        this.learningActivityService = learningActivityService;
    }

    /** vocabularyItemId present -> a session made of exactly that one item (practice-on-demand from
     *  its card/detail page). Otherwise the usual due/fresh selection, sorted by nextReviewAt. */
    public VocabularyPracticeSessionResponse getSession(String vocabularyItemId) throws DataNotFoundException {
        User user = userService.findByEmail(requestContext.getUserEmail());
        List<VocabularyItem> pool = vocabularyItemRepository.findByUser(user);

        if (vocabularyItemId != null) {
            VocabularyItem item = pool.stream()
                    .filter(i -> i.getId().equals(vocabularyItemId))
                    .findFirst()
                    .orElseThrow(() -> new DataNotFoundException("Vocabulary item not found!"));
            VocabularyProgress progress = vocabularyProgressRepository.findByUserAndVocabularyItem(user, item).orElse(null);
            boolean isNew = progress == null;
            PracticeVocabularyItemDto dto = toPracticeDto(item, progress, isNew, pool);
            return new VocabularyPracticeSessionResponse(List.of(dto), isNew ? 1 : 0, isNew ? 0 : 1);
        }

        List<VocabularyProgress> progresses = vocabularyProgressRepository.findByUserAndVocabularyItemIn(user, pool);
        Map<String, VocabularyProgress> progressByItemId = new HashMap<>();
        for (VocabularyProgress p : progresses) {
            progressByItemId.put(p.getVocabularyItem().getId(), p);
        }

        LocalDateTime now = LocalDateTime.now();
        List<VocabularyItem> due = new ArrayList<>();
        List<VocabularyItem> fresh = new ArrayList<>();
        for (VocabularyItem item : pool) {
            VocabularyProgress progress = progressByItemId.get(item.getId());
            if (progress == null) {
                fresh.add(item);
            } else if (progress.getMasteryLevel() != VocabularyMasteryLevel.MASTERED
                    && (progress.getNextReviewAt() == null || !progress.getNextReviewAt().isAfter(now))) {
                due.add(item);
            }
        }
        due.sort(Comparator.comparing(item -> {
            LocalDateTime dueAt = progressByItemId.get(item.getId()).getNextReviewAt();
            return dueAt == null ? LocalDateTime.MIN : dueAt;
        }));

        List<VocabularyItem> items = new ArrayList<>();
        for (VocabularyItem item : due) {
            if (items.size() >= SESSION_SIZE) break;
            items.add(item);
        }
        for (VocabularyItem item : fresh) {
            if (items.size() >= SESSION_SIZE) break;
            items.add(item);
        }

        int newCount = 0;
        List<PracticeVocabularyItemDto> dtos = new ArrayList<>();
        for (VocabularyItem item : items) {
            VocabularyProgress progress = progressByItemId.get(item.getId());
            boolean isNew = progress == null;
            if (isNew) newCount++;
            dtos.add(toPracticeDto(item, progress, isNew, pool));
        }

        return new VocabularyPracticeSessionResponse(dtos, newCount, dtos.size() - newCount);
    }

    /**
     * Grades both steps in one call. Flashcard: knewIt true -> recallScore+=20, else -10. Context
     * (only if a question exists for this item and the user answered it): correct -> contextScore
     * +=20, else -10. Combined correctness (both correct = SM-2 correct; either wrong, or context
     * skipped/unanswered and flashcard wrong = incorrect; context skipped/unanswered and flashcard
     * correct = still correct) drives applySm2, then masteryLevel is recomputed.
     */
    public VocabularyRoundResponse submitRound(VocabularyRoundRequest request) throws DataNotFoundException {
        User user = userService.findByEmail(requestContext.getUserEmail());
        VocabularyItem item = vocabularyItemRepository.findById(request.vocabularyItemId())
                .orElseThrow(() -> new DataNotFoundException("Vocabulary item not found!"));
        if (item.getUser() == null || !item.getUser().getId().equals(user.getId())) {
            throw new DataNotFoundException("Vocabulary item not found!");
        }
        VocabularyProgress progress = getOrCreateProgress(user, item);

        progress.setRecallScore(clamp(progress.getRecallScore() + (request.flashcardKnewIt() ? 20 : -10)));

        Boolean contextCorrect = null;
        String correctContextKey = null;
        List<VocabularyItem> pool = vocabularyItemRepository.findByUser(user);
        ContextQuestionWithAnswer generated = generateContextQuestion(item, pool);
        if (generated != null) {
            correctContextKey = generated.correctKey();
            if (request.contextSelectedKey() != null) {
                contextCorrect = generated.correctKey().equals(request.contextSelectedKey());
                progress.setContextScore(clamp(progress.getContextScore() + (contextCorrect ? 20 : -10)));
            }
        }

        boolean combinedCorrect = contextCorrect == null ? request.flashcardKnewIt() : (request.flashcardKnewIt() && contextCorrect);

        progress.setReviewCount(progress.getReviewCount() + 1);
        if (combinedCorrect) {
            progress.setCorrectCount(progress.getCorrectCount() + 1);
        } else {
            progress.setIncorrectCount(progress.getIncorrectCount() + 1);
        }
        progress.setLastReviewedAt(LocalDateTime.now());
        applySm2(progress, combinedCorrect);
        progress.setMasteryLevel(VocabularyMapper.computeMasteryLevel(progress));
        vocabularyProgressRepository.save(progress);
        learningActivityService.track(user.getId(), LearningModule.VOCABULARY, LearningActivityType.VOCABULARY_REVIEW_COMPLETED, item.getId());

        return new VocabularyRoundResponse(request.flashcardKnewIt(), contextCorrect, correctContextKey, VocabularyMapper.mapProgress(progress));
    }

    private VocabularyProgress getOrCreateProgress(User user, VocabularyItem item) {
        return vocabularyProgressRepository.findByUserAndVocabularyItem(user, item)
                .orElseGet(() -> {
                    VocabularyProgress created = new VocabularyProgress();
                    created.setUser(user);
                    created.setVocabularyItem(item);
                    return created;
                });
    }

    private void applySm2(VocabularyProgress progress, boolean correct) {
        LocalDateTime now = LocalDateTime.now();
        if (correct) {
            int repetitions = progress.getSrsRepetitions() + 1;
            int interval = switch (repetitions) {
                case 1 -> 1;
                case 2 -> 6;
                default -> (int) Math.round(Math.max(progress.getSrsInterval(), 1) * progress.getSrsEaseFactor());
            };
            progress.setSrsRepetitions(repetitions);
            progress.setSrsInterval(interval);
            progress.setSrsEaseFactor(progress.getSrsEaseFactor() + 0.1);
            progress.setNextReviewAt(now.plusDays(interval));
        } else {
            progress.setSrsRepetitions(0);
            progress.setSrsInterval(1);
            progress.setSrsEaseFactor(Math.max(MIN_EASE_FACTOR, progress.getSrsEaseFactor() - 0.2));
            progress.setNextReviewAt(now.plusDays(1));
        }
    }

    private PracticeVocabularyItemDto toPracticeDto(VocabularyItem item, VocabularyProgress progress, boolean isNew, List<VocabularyItem> pool) {
        ContextQuestionWithAnswer generated = generateContextQuestion(item, pool);
        return new PracticeVocabularyItemDto(
                item.getId(),
                item.getSource() != null ? item.getSource().name() : null,
                item.getWord(),
                item.getArticle(),
                item.getMeaning(),
                item.getExample(),
                item.getSynonyms(),
                item.getLevel() != null ? item.getLevel().getValue() : null,
                item.getAudioUrl(),
                progress != null && progress.getMasteryLevel() != null ? progress.getMasteryLevel().name() : VocabularyMasteryLevel.NEW.name(),
                isNew,
                generated != null ? generated.dto() : null
        );
    }

    /**
     * Deterministic given (item, pool): seeded off the item's own id so the exact same question -
     * same prompt, same option order/keys - can be regenerated at submitRound() time to grade the
     * user's answer, without persisting anything. If item.example contains the word, this is a
     * cloze MCQ (fill the blank with the word); otherwise a meaning-match MCQ using up to 3
     * distractor meanings from other items in the pool (same language/level preferred). Returns
     * null if the pool has fewer than 4 items total (this item + 3 distractors) - the round is
     * flashcard-only then.
     */
    private ContextQuestionWithAnswer generateContextQuestion(VocabularyItem item, List<VocabularyItem> pool) {
        List<VocabularyItem> others = pool.stream()
                .filter(i -> !i.getId().equals(item.getId()))
                .sorted(Comparator.comparing(VocabularyItem::getId))
                .toList();
        if (others.size() < 3) return null;

        Random seeded = new Random(item.getId().hashCode());

        boolean cloze = item.getExample() != null && item.getWord() != null
                && Pattern.compile(Pattern.quote(item.getWord()), Pattern.CASE_INSENSITIVE).matcher(item.getExample()).find();

        String prompt;
        String correctText;
        List<String> distractorTexts;

        if (cloze) {
            prompt = maskWord(item.getExample(), item.getWord());
            correctText = item.getWord();
            distractorTexts = pickDistractors(others, item, seeded, VocabularyItem::getWord, correctText);
        } else {
            prompt = "Was bedeutet \"" + item.getWord() + "\"?";
            correctText = item.getMeaning();
            distractorTexts = pickDistractors(others, item, seeded, VocabularyItem::getMeaning, correctText);
        }
        if (correctText == null || correctText.isBlank() || distractorTexts.size() < 3) return null;

        List<String> texts = new ArrayList<>();
        texts.add(correctText);
        texts.addAll(distractorTexts.subList(0, 3));

        List<Integer> order = new ArrayList<>(List.of(0, 1, 2, 3));
        Collections.shuffle(order, seeded);

        List<PracticeContextOptionDto> options = new ArrayList<>();
        String correctKey = null;
        for (int i = 0; i < order.size(); i++) {
            int originalIndex = order.get(i);
            String key = OPTION_KEYS[i];
            options.add(new PracticeContextOptionDto(key, texts.get(originalIndex)));
            if (originalIndex == 0) correctKey = key;
        }

        return new ContextQuestionWithAnswer(new PracticeContextQuestionDto(prompt, cloze, options), correctKey);
    }

    /** Same-language-then-same-level preference, randomized within each tier (stable sort keeps
     *  the seeded shuffle order inside a tier), deduplicated against the correct answer and against
     *  each other. */
    private List<String> pickDistractors(List<VocabularyItem> others, VocabularyItem item, Random seeded,
                                          Function<VocabularyItem, String> textFn, String correctText) {
        List<VocabularyItem> candidates = new ArrayList<>(others);
        Collections.shuffle(candidates, seeded);
        candidates.sort(Comparator.comparingInt(o -> tierOf(o, item)));

        List<String> distinctTexts = new ArrayList<>();
        for (VocabularyItem candidate : candidates) {
            String text = textFn.apply(candidate);
            if (text == null || text.isBlank()) continue;
            if (correctText != null && text.equalsIgnoreCase(correctText)) continue;
            if (distinctTexts.stream().anyMatch(t -> t.equalsIgnoreCase(text))) continue;
            distinctTexts.add(text);
            if (distinctTexts.size() == 3) break;
        }
        return distinctTexts;
    }

    private int tierOf(VocabularyItem candidate, VocabularyItem item) {
        boolean sameLanguage = candidate.getLanguage() != null && candidate.getLanguage().equals(item.getLanguage());
        boolean sameLevel = candidate.getLevel() != null && candidate.getLevel() == item.getLevel();
        if (sameLanguage && sameLevel) return 0;
        if (sameLanguage) return 1;
        return 2;
    }

    private String maskWord(String sentence, String word) {
        Pattern pattern = Pattern.compile(Pattern.quote(word), Pattern.CASE_INSENSITIVE);
        return pattern.matcher(sentence).replaceFirst("______");
    }

    private double clamp(double value) {
        return Math.max(0, Math.min(100, value));
    }

    /** Internal only - carries the correct option key alongside the answer-free DTO so submitRound
     *  can grade without leaking it through PracticeVocabularyItemDto. */
    private record ContextQuestionWithAnswer(PracticeContextQuestionDto dto, String correctKey) {
    }
}
