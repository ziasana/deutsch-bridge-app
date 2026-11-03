package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.ExamProfile;
import com.deutschbridge.backend.model.examsim.ExamPartConfig;
import com.deutschbridge.backend.repository.ExamExerciseCompletionRepository;
import com.deutschbridge.backend.repository.ExamExerciseRepository;
import com.deutschbridge.backend.repository.ExamSimulationUsageRepository;
import com.deutschbridge.backend.model.entity.ExamExerciseCompletion;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Candidate pools and remaining (never-reserved) content per part, for learners, admins and profile validation. */
@Service
public class ExamPoolService {

    /** Availability of one part. unusedForUser is -1 when computed without a user (admin overview). */
    public record PartAvailability(String partKey, String label, int required, int eligible, int unusedForUser, int minRemainingAcrossUsers,
                                   int expectedQuestions, Map<String, Integer> ineligibleReasons, Map<Integer, Integer> questionCounts) {
        public PartAvailability(String partKey, String label, int required, int eligible, int unusedForUser, int minRemainingAcrossUsers) {
            this(partKey, label, required, eligible, unusedForUser, minRemainingAcrossUsers, 0, Map.of(), Map.of());
        }

        public boolean sufficientFor(int needed) {
            return unusedForUser >= needed;
        }
    }

    private final ExamExerciseRepository exerciseRepository;
    private final ExamSimulationUsageRepository usageRepository;
    private final ExamExerciseCompletionRepository completionRepository;
    private final com.deutschbridge.backend.repository.ExamSimulationSetPartRepository setPartRepository;
    private final com.deutschbridge.backend.service.cache.ContentCacheService contentCacheService;

    public ExamPoolService(ExamExerciseRepository exerciseRepository, ExamSimulationUsageRepository usageRepository,
                           ExamExerciseCompletionRepository completionRepository,
                           com.deutschbridge.backend.repository.ExamSimulationSetPartRepository setPartRepository,
                           com.deutschbridge.backend.service.cache.ContentCacheService contentCacheService) {
        this.contentCacheService = contentCacheService;
        this.setPartRepository = setPartRepository;
        this.exerciseRepository = exerciseRepository;
        this.usageRepository = usageRepository;
        this.completionRepository = completionRepository;
    }

    /**
     * All published exercises that satisfy the part's selection rules. Read from the shared exam content cache (cleared on every exam
     * exercise write): the overview asks this once per part, and each ask used to read every exercise of the section from the database.
     */
    public List<ExamExercise> eligibleExercises(ExamProfile profile, ExamPartConfig part) {
        return contentCacheService.getPublishedExamExercises(part.section(), profile.getLevel(), null, profile.getExamType()).stream()
                .filter(e -> ExamExerciseEligibility.isEligible(e, profile.getExamType(), profile.getLevel(), part))
                .toList();
    }

    /** Eligible exercises the user has not reserved before (and, if configured, has not completed in ordinary practice). */
    public List<ExamExercise> unusedFor(String userId, ExamProfile profile, ExamPartConfig part) {
        Set<String> blocked = blockedIds(userId, profile);
        return eligibleExercises(profile, part).stream().filter(e -> !blocked.contains(e.getId())).toList();
    }

    public Set<String> blockedIds(String userId, ExamProfile profile) {
        // Exam sets are shared and generated up front, so there is no per-user reservation any more.
        Set<String> blocked = new HashSet<>();
        if (profile.isExcludePracticedExercises()) {
            completionRepository.findByUserId(userId).stream().map(ExamExerciseCompletion::getExerciseId).forEach(blocked::add);
        }
        return blocked;
    }

    /** Per-part availability for one learner. */
    public List<PartAvailability> availabilityForUser(String userId, ExamProfile profile) {
        Set<String> blocked = blockedIds(userId, profile);
        List<PartAvailability> result = new ArrayList<>();
        for (ExamPartConfig part : profile.getConfig().partsOrEmpty()) {
            List<ExamExercise> eligible = eligibleExercises(profile, part);
            int unused = (int) eligible.stream().filter(e -> !blocked.contains(e.getId())).count();
            result.add(new PartAvailability(part.key(), part.label(), part.effectiveExerciseCount(), eligible.size(), unused, -1));
        }
        return result;
    }

    /**
     * Admin overview: eligible content per part and, as minRemainingAcrossUsers, how many eligible exercises are not yet in any
     * exam set of the profile (how many more sets can be generated without reusing an exercise).
     */
    public List<PartAvailability> availabilityOverview(ExamProfile profile) {
        Set<String> inSets = setPartRepository.countUses(profile.getCode()).stream()
                .map(com.deutschbridge.backend.repository.ExamSimulationSetPartRepository.ExerciseUse::getExerciseId).collect(Collectors.toSet());
        List<PartAvailability> result = new ArrayList<>();
        for (ExamPartConfig part : profile.getConfig().partsOrEmpty()) {
            List<ExamExercise> eligible = eligibleExercises(profile, part);
            int fresh = (int) eligible.stream().filter(e -> !inSets.contains(e.getId())).count();
            result.add(diagnose(profile, part, new PartAvailability(part.key(), part.label(), part.effectiveExerciseCount(), eligible.size(), -1, fresh)));
        }
        return result;
    }

    /**
     * Admin diagnostics for a part: of the exercises of this exam type / level that belong to the part's section (any status),
     * how many are rejected for which reason, and which question counts exist - so a shortage can be fixed.
     */
    public PartAvailability diagnose(ExamProfile profile, ExamPartConfig part, PartAvailability base) {
        Map<String, Integer> reasons = new java.util.TreeMap<>();
        Map<Integer, Integer> counts = new java.util.TreeMap<>();
        for (ExamExercise e : exerciseRepository.findFiltered(part.section(), profile.getLevel(), null, profile.getExamType())) {
            if (e.getExamType() != profile.getExamType()) continue;
            String reason = ExamExerciseEligibility.rejection(e, profile.getExamType(), profile.getLevel(), part);
            if (reason == null) continue;
            if ("OTHER_TEIL".equals(reason) || "OTHER_SECTION".equals(reason)) continue;
            reasons.merge(reason, 1, Integer::sum);
            if (e.getQuestions() != null && "QUESTION_COUNT".equals(reason)) counts.merge(e.getQuestions().size(), 1, Integer::sum);
        }
        int expected = part.questionCount() != null ? part.questionCount() / part.effectiveExerciseCount() : 0;
        return new PartAvailability(base.partKey(), base.label(), base.required(), base.eligible(), base.unusedForUser(), base.minRemainingAcrossUsers(), expected, reasons, counts);
    }

    public Map<String, ExamExercise> byId(List<ExamExercise> exercises) {
        return exercises.stream().collect(Collectors.toMap(ExamExercise::getId, Function.identity()));
    }
}
