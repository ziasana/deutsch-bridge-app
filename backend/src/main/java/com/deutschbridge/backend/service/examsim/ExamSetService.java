package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.exception.ExamSimulationException;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.ExamProfile;
import com.deutschbridge.backend.model.entity.ExamSimulationSet;
import com.deutschbridge.backend.model.entity.ExamSimulationSetPart;
import com.deutschbridge.backend.model.enums.ExamSetStatus;
import com.deutschbridge.backend.model.examsim.ExamPartConfig;
import com.deutschbridge.backend.model.examsim.ExerciseSnapshot;
import com.deutschbridge.backend.repository.ExamExerciseRepository;
import com.deutschbridge.backend.repository.ExamSimulationSetPartRepository;
import com.deutschbridge.backend.repository.ExamSimulationSetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.random.RandomGenerator;

/**
 * Pre-generated exams ("Prüfung 1, 2, ...") of a profile, shared by all learners of its level. An admin generates a draft,
 * reviews it and publishes it; a learner starting a set gets the set's exercises snapshotted into a new attempt.
 * <p>
 * Generation prefers exercises that are not yet in any non-archived set of the profile, so sets differ as long as the pool
 * allows it; when a part runs out of fresh exercises the least-used one is reused and the admin gets a warning.
 */
@Service
public class ExamSetService {

    /** One exercise of a set with the title for display. exerciseAvailable is false when it can no longer be used. */
    public record SetPart(String partKey, String partLabel, int ordinal, String exerciseId, String exerciseTitle, boolean exerciseAvailable) {
    }

    public record SetDetail(String id, String profileCode, int number, String title, ExamSetStatus status, Instant createdAt, Instant publishedAt,
                            List<SetPart> parts, List<String> warnings) {
    }

    /** What a learner needs to start a set. */
    public record StartPart(ExamPartConfig part, int ordinal, ExamExercise exercise, ExerciseSnapshot snapshot) {
    }

    private final ExamPoolService poolService;
    private final ExamExerciseRepository exerciseRepository;
    private final ExamSimulationSetRepository setRepository;
    private final ExamSimulationSetPartRepository setPartRepository;
    // java.util.Random rather than RandomGenerator.getDefault(): the default needs the jdk.random module, which the
    // slim eclipse-temurin JRE runtime image does not include (startup then fails with "Constructor threw exception").
    private RandomGenerator random = new java.util.Random();

    public ExamSetService(ExamPoolService poolService, ExamExerciseRepository exerciseRepository, ExamSimulationSetRepository setRepository,
                          ExamSimulationSetPartRepository setPartRepository) {
        this.poolService = poolService;
        this.exerciseRepository = exerciseRepository;
        this.setRepository = setRepository;
        this.setPartRepository = setPartRepository;
    }

    void setRandom(RandomGenerator random) {
        this.random = random;
    }

    // ---------------------------------------------------------------- admin

    @org.springframework.cache.annotation.CacheEvict(cacheNames = "examSimOverview", allEntries = true)
    @Transactional
    public SetDetail generate(ExamProfile profile, String adminId) {
        Map<String, Long> uses = setPartRepository.countUses(profile.getCode()).stream()
                .collect(Collectors.toMap(ExamSimulationSetPartRepository.ExerciseUse::getExerciseId, ExamSimulationSetPartRepository.ExerciseUse::getUses));
        Set<String> chosenNow = new HashSet<>();
        List<ChosenPart> chosen = new ArrayList<>();
        List<Map<String, Object>> shortages = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        for (ExamPartConfig part : profile.getConfig().partsOrEmpty()) {
            List<ExamExercise> candidates = new ArrayList<>(poolService.eligibleExercises(profile, part).stream()
                    .filter(e -> !chosenNow.contains(e.getId())).toList());
            int needed = part.effectiveExerciseCount();
            if (candidates.size() < needed) {
                shortages.add(Map.of("partKey", part.key(), "label", part.label() != null ? part.label() : part.key(),
                        "required", needed, "available", candidates.size()));
                continue;
            }
            Collections.shuffle(candidates, random);
            // stable sort: the shuffle decides among equally used exercises, the least used come first
            candidates.sort(Comparator.comparingLong(e -> uses.getOrDefault(e.getId(), 0L)));
            for (int i = 0; i < needed; i++) {
                ExamExercise exercise = candidates.get(i);
                chosenNow.add(exercise.getId());
                chosen.add(new ChosenPart(part, i, exercise));
                if (uses.getOrDefault(exercise.getId(), 0L) > 0) {
                    warnings.add((part.label() != null ? part.label() : part.key()) + ": no unused exercise left, \"" + exercise.getTitle() + "\" is reused from another set.");
                }
            }
        }
        if (!shortages.isEmpty()) {
            throw ExamSimulationException.conflict("INSUFFICIENT_CONTENT",
                    "Not enough eligible exercises to generate an exam set.", Map.of("shortages", shortages));
        }

        ExamSimulationSet set = new ExamSimulationSet();
        int number = setRepository.maxNumber(profile.getCode()) + 1;
        set.setProfileCode(profile.getCode());
        set.setNumber(number);
        set.setTitle("Prüfung " + number);
        set.setStatus(ExamSetStatus.DRAFT);
        set.setCreatedBy(adminId);
        set = setRepository.saveAndFlush(set);
        for (ChosenPart c : chosen) {
            ExamSimulationSetPart sp = new ExamSimulationSetPart();
            sp.setSetId(set.getId());
            sp.setPartKey(c.part.key());
            sp.setOrdinal(c.ordinal);
            sp.setExerciseId(c.exercise.getId());
            sp.setExerciseVersion(c.exercise.getVersion());
            setPartRepository.save(sp);
        }
        return detail(profile, set, warnings);
    }

    @Transactional(readOnly = true)
    public List<SetDetail> list(ExamProfile profile) {
        return setRepository.findByProfileCodeOrderByNumberAsc(profile.getCode()).stream().map(s -> detail(profile, s, List.of())).toList();
    }

    @org.springframework.cache.annotation.CacheEvict(cacheNames = "examSimOverview", allEntries = true)
    @Transactional
    public SetDetail publish(ExamProfile profile, String setId) throws DataNotFoundException {
        ExamSimulationSet set = load(profile, setId);
        if (set.getStatus() != ExamSetStatus.DRAFT) {
            throw ExamSimulationException.conflict("SET_NOT_DRAFT", "Only a draft set can be published.");
        }
        SetDetail check = detail(profile, set, List.of());
        if (check.parts().stream().anyMatch(p -> !p.exerciseAvailable())) {
            throw ExamSimulationException.conflict("SET_UNAVAILABLE", "An exercise of this set can no longer be used. Discard the set and generate a new one.");
        }
        set.setStatus(ExamSetStatus.PUBLISHED);
        set.setPublishedAt(Instant.now());
        return detail(profile, setRepository.save(set), List.of());
    }

    /** Published sets are archived (hidden from learners, results stay); drafts are deleted. */
    @org.springframework.cache.annotation.CacheEvict(cacheNames = "examSimOverview", allEntries = true)
    @Transactional
    public void discard(ExamProfile profile, String setId) throws DataNotFoundException {
        ExamSimulationSet set = load(profile, setId);
        if (set.getStatus() == ExamSetStatus.DRAFT) {
            setPartRepository.deleteBySetId(set.getId());
            setRepository.delete(set);
        } else {
            set.setStatus(ExamSetStatus.ARCHIVED);
            setRepository.save(set);
        }
    }

    // ---------------------------------------------------------------- learner

    @Transactional(readOnly = true)
    public List<ExamSimulationSet> publishedSets(ExamProfile profile) {
        return setRepository.findByProfileCodeAndStatusOrderByNumberAsc(profile.getCode(), ExamSetStatus.PUBLISHED);
    }

    /** The published set, verified to belong to the profile. */
    @Transactional(readOnly = true)
    public ExamSimulationSet requirePublished(ExamProfile profile, String setId) {
        ExamSimulationSet set = setId == null ? null : setRepository.findById(setId).filter(s -> s.getProfileCode().equals(profile.getCode())).orElse(null);
        if (set == null || set.getStatus() != ExamSetStatus.PUBLISHED) {
            throw ExamSimulationException.conflict("SET_NOT_AVAILABLE", "This exam is not available.");
        }
        return set;
    }

    /** Resolves the set's exercises for a new attempt, failing when one of them is gone or no longer valid for its part. */
    @Transactional(readOnly = true)
    public List<StartPart> resolveForStart(ExamProfile profile, ExamSimulationSet set) {
        Map<String, ExamPartConfig> parts = profile.getConfig().partsOrEmpty().stream().collect(Collectors.toMap(ExamPartConfig::key, Function.identity()));
        List<StartPart> result = new ArrayList<>();
        for (ExamSimulationSetPart sp : setPartRepository.findBySetIdOrderByPartKeyAscOrdinalAsc(set.getId())) {
            ExamPartConfig part = parts.get(sp.getPartKey());
            ExamExercise exercise = exerciseRepository.findById(sp.getExerciseId()).orElse(null);
            if (part == null || exercise == null
                    || !ExamExerciseEligibility.isEligible(exercise, profile.getExamType(), profile.getLevel(), part)) {
                throw ExamSimulationException.conflict("SET_UNAVAILABLE", "This exam is currently unavailable. Please try another one.");
            }
            result.add(new StartPart(part, sp.getOrdinal(), exercise, ExerciseSnapshot.of(exercise, speakingOf(exercise))));
        }
        if (result.size() != profile.getConfig().partsOrEmpty().stream().mapToInt(ExamPartConfig::effectiveExerciseCount).sum()) {
            throw ExamSimulationException.conflict("SET_UNAVAILABLE", "This exam is currently unavailable. Please try another one.");
        }
        return result;
    }

    // ---------------------------------------------------------------- helpers

    private record ChosenPart(ExamPartConfig part, int ordinal, ExamExercise exercise) {
    }

    private ExamSimulationSet load(ExamProfile profile, String setId) throws DataNotFoundException {
        return setRepository.findById(setId).filter(s -> s.getProfileCode().equals(profile.getCode()))
                .orElseThrow(() -> new DataNotFoundException("Exam set not found!"));
    }

    private SetDetail detail(ExamProfile profile, ExamSimulationSet set, List<String> warnings) {
        Map<String, ExamPartConfig> parts = profile.getConfig().partsOrEmpty().stream().collect(Collectors.toMap(ExamPartConfig::key, Function.identity()));
        List<ExamSimulationSetPart> setParts = setPartRepository.findBySetIdOrderByPartKeyAscOrdinalAsc(set.getId());
        Map<String, ExamExercise> exercises = new HashMap<>();
        exerciseRepository.findAllById(setParts.stream().map(ExamSimulationSetPart::getExerciseId).toList()).forEach(e -> exercises.put(e.getId(), e));
        List<SetPart> out = new ArrayList<>();
        for (ExamSimulationSetPart sp : setParts) {
            ExamPartConfig part = parts.get(sp.getPartKey());
            ExamExercise e = exercises.get(sp.getExerciseId());
            boolean ok = part != null && e != null && ExamExerciseEligibility.isEligible(e, profile.getExamType(), profile.getLevel(), part);
            out.add(new SetPart(sp.getPartKey(), part != null ? part.label() : sp.getPartKey(), sp.getOrdinal(), sp.getExerciseId(),
                    e != null ? e.getTitle() : null, ok));
        }
        return new SetDetail(set.getId(), set.getProfileCode(), set.getNumber(), set.getTitle(), set.getStatus(), set.getCreatedAt(), set.getPublishedAt(), out, warnings);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> speakingOf(ExamExercise e) {
        return e.getMetadata() != null && e.getMetadata().get("speaking") instanceof Map<?, ?> m ? (Map<String, Object>) m : null;
    }
}
