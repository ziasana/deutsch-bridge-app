package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.examsim.ExamSimulationDtos.*;
import com.deutschbridge.backend.model.entity.ExamProfile;
import com.deutschbridge.backend.model.entity.ExamSimulationAttempt;
import com.deutschbridge.backend.model.entity.ExamSimulationSet;
import com.deutschbridge.backend.model.enums.ExamProfileStatus;
import com.deutschbridge.backend.model.enums.SimulationAttemptStatus;
import com.deutschbridge.backend.model.examsim.ExamPartConfig;
import com.deutschbridge.backend.model.examsim.ExamTimerConfig;
import com.deutschbridge.backend.repository.ExamSimulationAttemptRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Learner-facing overview of the available exam profiles: structure, rules, remaining content and own results. */
@Service
public class ExamSimulationOverviewService {

    private final ExamProfileService profileService;
    private final ExamPoolService poolService;
    private final ExamSetService setService;
    private final ExamProfileValidator validator;
    private final ExamSimulationAttemptRepository attemptRepository;
    private final ExamSimulationViewBuilder views;
    private final ExamSimulationService simulationService;
    private final Clock clock;

    public ExamSimulationOverviewService(ExamProfileService profileService, ExamPoolService poolService, ExamSetService setService, ExamProfileValidator validator,
                                         ExamSimulationAttemptRepository attemptRepository, ExamSimulationViewBuilder views,
                                         ExamSimulationService simulationService, Clock clock) {
        this.profileService = profileService;
        this.poolService = poolService;
        this.setService = setService;
        this.validator = validator;
        this.attemptRepository = attemptRepository;
        this.views = views;
        this.simulationService = simulationService;
        this.clock = clock;
    }

    /** Cached per learner (see CacheConfig); cleared by the learner's own exam actions and by any change to profiles, sets, exercises or assessments. */
    @org.springframework.cache.annotation.Cacheable(cacheNames = "examSimOverview", key = "#userId")
    @Transactional(readOnly = true)
    public List<ProfileOverview> list(String userId) {
        List<ExamProfile> profiles = profileService.listPublished();
        if (profiles.isEmpty()) return List.of();
        // One light read of the learner's attempts for all profiles, split here.
        Map<String, List<ExamSimulationAttemptRepository.AttemptRow>> attemptsByProfile = attemptRepository.findRowsByUser(userId).stream()
                .collect(Collectors.groupingBy(ExamSimulationAttemptRepository.AttemptRow::getProfileCode, java.util.LinkedHashMap::new, Collectors.toList()));
        return profiles.stream().map(p -> overview(userId, p, attemptsByProfile.getOrDefault(p.getCode(), List.of()))).toList();
    }

    /** Published, valid mock exams for the public site: structure and rules only, no per-user availability or results. */
    @Transactional(readOnly = true)
    public List<PublicProfile> listPublic() {
        return profileService.listPublished().stream().filter(p -> validator.validate(p).isValid()).map(this::publicOverview).toList();
    }

    @Transactional(readOnly = true)
    public ProfileOverview get(String userId, String profileId) throws DataNotFoundException {
        ExamProfile profile = profileService.get(profileId);
        if (profile.getStatus() != ExamProfileStatus.PUBLISHED) throw new DataNotFoundException("Exam profile not found!");
        return overview(userId, profile, attemptRepository.findRowsByUser(userId).stream().filter(a -> profile.getCode().equals(a.getProfileCode())).toList());
    }

    private ProfileOverview overview(String userId, ExamProfile p, List<ExamSimulationAttemptRepository.AttemptRow> attempts) {
        List<ExamPoolService.PartAvailability> availability = poolService.availabilityForUser(userId, p);
        Map<String, ExamPoolService.PartAvailability> byKey = availability.stream().collect(Collectors.toMap(ExamPoolService.PartAvailability::partKey, a -> a));

        List<StageOverview> stages = new ArrayList<>();
        for (ExamTimerConfig t : p.getConfig().timersOrEmpty()) {
            stages.add(new StageOverview(t.key(), t.label(), t.minutes(), t.effectiveKind(), ExamSimulationViewBuilder.partKeysShownIn(p.getConfig(), t)));
        }
        List<PartOverview> parts = new ArrayList<>();
        for (ExamPartConfig c : p.getConfig().partsOrEmpty()) {
            ExamPoolService.PartAvailability a = byKey.get(c.key());
            parts.add(new PartOverview(c.key(), c.label(), c.module(), c.section(), c.teil(), c.questionCount() != null ? c.questionCount() : 0,
                    c.pointsPerQuestion(), c.maxPoints(), c.scoringMethod(), c.timerKey(), c.rubricOrEmpty(), c.effectiveExerciseCount(),
                    a.eligible(), a.unusedForUser()));
        }
        int totalMinutes = p.getConfig().timersOrEmpty().stream().mapToInt(ExamTimerConfig::minutes).sum();

        long graceCutoff = clock.millis() - simulationService.graceMillis();
        ExamSimulationAttemptRepository.AttemptRow activeAttempt = attempts.stream()
                .filter(a -> a.getStatus() == SimulationAttemptStatus.IN_PROGRESS && a.getFinalDeadlineAt().toEpochMilli() > graceCutoff)
                .findFirst().orElse(null);
        String active = activeAttempt != null ? activeAttempt.getId() : null;
        List<ExamSimulationAttemptRepository.AttemptRow> finished = attempts.stream()
                .filter(a -> a.getStatus() == SimulationAttemptStatus.COMPLETED || a.getStatus() == SimulationAttemptStatus.EXPIRED).toList();
        AttemptSummary best = finished.stream().filter(a -> a.getResult() != null && a.getResult().writtenComplete())
                .max(Comparator.comparing((ExamSimulationAttemptRepository.AttemptRow a) -> a.getResult().writtenScore())).map(views::summary).orElse(null);
        AttemptSummary latest = finished.stream().findFirst().map(views::summary).orElse(null);

        String blocked = null;
        if (active != null) {
            blocked = "ACTIVE_ATTEMPT";
        } else if (!validator.validate(p).isValid()) {
            blocked = "PROFILE_INVALID";
        }
        List<SetOverview> sets = new ArrayList<>();
        for (ExamSimulationSet set : setService.publishedSets(p)) {
            ExamSimulationAttemptRepository.AttemptRow mine = attempts.stream().filter(a -> set.getId().equals(a.getSetId())).findFirst().orElse(null);
            // DONE: taken and final or waiting; RETRY: finished and not passed, so it can be taken again.
            String status = mine == null ? "NEW" : mine == activeAttempt ? "IN_PROGRESS"
                    : ExamRetryRule.canRepeat(mine.getStatus(), mine.getResult()) ? "RETRY" : "DONE";
            sets.add(new SetOverview(set.getId(), set.getNumber(), set.getTitle(), status, mine != null ? mine.getId() : null,
                    mine != null && (status.equals("DONE") || status.equals("RETRY")) ? views.summary(mine) : null));
        }
        if (blocked == null && sets.stream().noneMatch(x -> x.status().equals("NEW") || x.status().equals("RETRY"))) {
            blocked = "NO_NEW_EXAM";
        }
        BigDecimal total = p.getWrittenMaxPoints().add(p.getOralMaxPoints());
        return new ProfileOverview(p.getId(), p.getCode(), p.getVersion(), p.getProvider(), p.getExamName(), p.getTitle(), p.getDescription(),
                p.getLevel().getValue(), p.isOralScoringEnabled(), p.getWrittenMaxPoints(), p.getWrittenPassThreshold(), p.getOralMaxPoints(),
                p.getOralPassThreshold(), total, p.getAnswerReleasePolicy(), totalMinutes, stages, parts, blocked == null,
                blocked, active, activeAttempt != null && activeAttempt.getPausedAt() != null, best, latest, finished.size(), sets);
    }

    private PublicProfile publicOverview(ExamProfile p) {
        List<PublicStage> stages = p.getConfig().timersOrEmpty().stream().map(t -> new PublicStage(t.label(), t.minutes())).toList();
        List<PublicPart> parts = p.getConfig().partsOrEmpty().stream()
                .map(c -> new PublicPart(c.label(), c.module(), c.section(), c.teil(), c.questionCount() != null ? c.questionCount() : 0, c.maxPoints()))
                .toList();
        int totalMinutes = stages.stream().mapToInt(PublicStage::minutes).sum();
        return new PublicProfile(p.getId(), p.getProvider(), p.getExamName(), p.getTitle(), p.getDescription(), p.getLevel().getValue(), totalMinutes,
                p.isOralScoringEnabled(), p.getWrittenMaxPoints(), p.getWrittenPassThreshold(), stages, parts);
    }
}
