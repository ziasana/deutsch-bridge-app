package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.exception.ExamSimulationException;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.ExamProfile;
import com.deutschbridge.backend.model.entity.ExamSimulationUsage;
import com.deutschbridge.backend.model.examsim.ExamPartConfig;
import com.deutschbridge.backend.model.examsim.ExerciseSnapshot;
import com.deutschbridge.backend.repository.ExamSimulationUsageRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.random.RandomGenerator;

/**
 * Draws exercises for a new attempt and reserves them in the usage ledger.
 * <p>
 * Concurrency: the caller's transaction first takes a Postgres advisory lock for (user, profile code), so two simultaneous
 * starts of the same learner run one after the other and the second one sees the first one's reservations. The unique
 * constraint on the ledger is the second line of defence.
 */
@Service
public class ExamExerciseSelectionService {

    /** One exercise chosen for a part. */
    public record Selection(ExamPartConfig part, int ordinal, ExamExercise exercise, ExerciseSnapshot snapshot) {
    }

    @PersistenceContext
    private EntityManager entityManager;

    private final ExamPoolService poolService;
    private final ExamSimulationUsageRepository usageRepository;
    private RandomGenerator random = RandomGenerator.getDefault();

    public ExamExerciseSelectionService(ExamPoolService poolService, ExamSimulationUsageRepository usageRepository) {
        this.poolService = poolService;
        this.usageRepository = usageRepository;
    }

    void setRandom(RandomGenerator random) {
        this.random = random;
    }

    /** Serialises concurrent starts for the same learner and profile code until the surrounding transaction ends. */
    @Transactional(propagation = Propagation.MANDATORY)
    public void lockPool(String userId, String profileCode) {
        entityManager.createNativeQuery("SELECT count(*) FROM (SELECT pg_advisory_xact_lock(hashtextextended(:key, 0))) l")
                .setParameter("key", "exam-sim:" + userId + ":" + profileCode)
                .getSingleResult();
    }

    /**
     * Picks unused eligible exercises for every part and reserves them. Never reuses a reserved exercise: if any part cannot be
     * filled, nothing is reserved and an INSUFFICIENT_CONTENT conflict listing all short parts is thrown.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public List<Selection> selectAndReserve(String userId, ExamProfile profile, String attemptId) {
        Set<String> blocked = poolService.blockedIds(userId, profile);
        Set<String> chosenNow = new HashSet<>();
        List<Selection> selections = new ArrayList<>();
        List<Map<String, Object>> shortages = new ArrayList<>();

        for (ExamPartConfig part : profile.getConfig().partsOrEmpty()) {
            List<ExamExercise> candidates = new ArrayList<>(poolService.eligibleExercises(profile, part).stream()
                    .filter(e -> !blocked.contains(e.getId()) && !chosenNow.contains(e.getId())).toList());
            int needed = part.effectiveExerciseCount();
            if (candidates.size() < needed) {
                shortages.add(Map.of("partKey", part.key(), "label", part.label() != null ? part.label() : part.key(),
                        "required", needed, "available", candidates.size()));
                continue;
            }
            Collections.shuffle(candidates, random);
            for (int i = 0; i < needed; i++) {
                ExamExercise exercise = candidates.get(i);
                chosenNow.add(exercise.getId());
                selections.add(new Selection(part, i, exercise, ExerciseSnapshot.of(exercise, speakingOf(exercise))));
            }
        }
        if (!shortages.isEmpty()) {
            throw ExamSimulationException.conflict("INSUFFICIENT_CONTENT",
                    "Not enough unused exercises for this exam. No exercise is ever repeated, so no new attempt can be started.",
                    Map.of("shortages", shortages));
        }
        try {
            List<ExamSimulationUsage> usages = selections.stream().map(s -> {
                ExamSimulationUsage u = new ExamSimulationUsage();
                u.setUserId(userId);
                u.setProfileCode(profile.getCode());
                u.setExerciseId(s.exercise().getId());
                u.setAttemptId(attemptId);
                u.setPartKey(s.part().key());
                return u;
            }).toList();
            usageRepository.saveAllAndFlush(usages);
        } catch (DataIntegrityViolationException e) {
            throw ExamSimulationException.conflict("RESERVATION_CONFLICT", "The exercises were reserved by a parallel request. Please try again.");
        }
        return selections;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> speakingOf(ExamExercise e) {
        return e.getMetadata() != null && e.getMetadata().get("speaking") instanceof Map<?, ?> m ? (Map<String, Object>) m : null;
    }
}
