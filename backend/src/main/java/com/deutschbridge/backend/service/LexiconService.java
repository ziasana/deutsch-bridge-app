package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.SaveLexiconRequest;
import com.deutschbridge.backend.model.dto.SrsReviewRequest;
import com.deutschbridge.backend.model.dto.UserWordProgressResponse;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserWordProgress;
import com.deutschbridge.backend.model.enums.WordProgressStatus;
import com.deutschbridge.backend.repository.UserWordProgressRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

/**
 * The user's personal lexicon - built from words/phrases tapped and saved while reading
 * (spec section 1.3 / 3.3), and reviewed via spaced repetition (spec section 6). This is
 * intentionally separate from the generic LearningProgress "learned" toggle: it carries
 * per-lemma quiz stats, SRS scheduling state, and the original context sentence.
 */
@Service
public class LexiconService {

    private static final double MIN_EASE_FACTOR = 1.3;
    private static final int KNOWN_AFTER_REPETITIONS = 3;

    private final UserWordProgressRepository repository;
    private final RequestContext requestContext;
    private final UserService userService;

    public LexiconService(UserWordProgressRepository repository, RequestContext requestContext, UserService userService) {
        this.repository = repository;
        this.requestContext = requestContext;
        this.userService = userService;
    }

    public UserWordProgressResponse save(SaveLexiconRequest request) {
        User user = userService.findByEmail(requestContext.getUserEmail());

        UserWordProgress progress = repository.findByUserAndLemma(user, request.lemma())
                .orElseGet(() -> {
                    UserWordProgress created = new UserWordProgress();
                    created.setUser(user);
                    created.setLemma(request.lemma());
                    created.setType(request.type());
                    created.setStatus(WordProgressStatus.NEW);
                    created.setFirstSeenArticleId(request.articleId());
                    created.setFirstSeenSentence(request.sentence());
                    return created;
                });

        progress.setTimesSeen(progress.getTimesSeen() + 1);
        progress.setLastReviewedAt(LocalDateTime.now());
        if (request.translation() != null) {
            progress.setTranslation(request.translation());
        }

        return toResponse(repository.save(progress));
    }

    public List<UserWordProgressResponse> getAll() {
        User user = userService.findByEmail(requestContext.getUserEmail());
        return repository.findByUser(user).stream().map(this::toResponse).toList();
    }

    /**
     * Every NEW/LEARNING word becomes a flashcard due for review once its srsDueAt has passed
     * (spec section 6). KNOWN words drop out of the queue and stop being highlighted in articles.
     */
    public List<UserWordProgressResponse> getReviewQueue() {
        User user = userService.findByEmail(requestContext.getUserEmail());
        LocalDateTime now = LocalDateTime.now();

        return repository.findByUser(user).stream()
                .filter(p -> p.getStatus() != WordProgressStatus.KNOWN)
                .filter(p -> p.getSrsDueAt() == null || !p.getSrsDueAt().isAfter(now))
                .sorted(Comparator.comparing(UserWordProgress::getSrsDueAt, Comparator.nullsFirst(Comparator.naturalOrder())))
                .map(this::toResponse)
                .toList();
    }

    /**
     * Applies an SM-2-style update: a correct review grows the interval (1 -> 6 -> interval*easeFactor)
     * and nudges the ease factor up; an incorrect review resets the interval/repetition count and
     * lowers the ease factor (floored at 1.3, matching SM-2's own floor). A word graduates from
     * LEARNING to KNOWN after three consecutive correct reviews; any miss demotes it back to LEARNING.
     */
    public UserWordProgressResponse review(SrsReviewRequest request) throws DataNotFoundException {
        User user = userService.findByEmail(requestContext.getUserEmail());
        UserWordProgress progress = repository.findByUserAndLemma(user, request.lemma())
                .orElseThrow(() -> new DataNotFoundException("Word not found in your lexicon!"));

        applySm2(progress, request.correct());
        progress.setLastReviewedAt(LocalDateTime.now());

        return toResponse(repository.save(progress));
    }

    private void applySm2(UserWordProgress progress, boolean correct) {
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
            progress.setSrsDueAt(now.plusDays(interval));
            progress.setStatus(repetitions >= KNOWN_AFTER_REPETITIONS ? WordProgressStatus.KNOWN : WordProgressStatus.LEARNING);
        } else {
            progress.setSrsRepetitions(0);
            progress.setSrsInterval(1);
            progress.setSrsEaseFactor(Math.max(MIN_EASE_FACTOR, progress.getSrsEaseFactor() - 0.2));
            progress.setSrsDueAt(now.plusDays(1));
            progress.setStatus(WordProgressStatus.LEARNING);
        }
    }

    private UserWordProgressResponse toResponse(UserWordProgress progress) {
        return new UserWordProgressResponse(
                progress.getId(),
                progress.getLemma(),
                progress.getType(),
                progress.getStatus(),
                progress.getFirstSeenSentence(),
                progress.getTranslation(),
                progress.getTimesSeen(),
                progress.getSavedAt(),
                progress.getSrsDueAt()
        );
    }
}
