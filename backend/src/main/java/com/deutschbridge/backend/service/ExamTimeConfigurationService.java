package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExamTimeBulkUpdateRequest;
import com.deutschbridge.backend.model.dto.ExamTimeConfigurationResponse;
import com.deutschbridge.backend.model.dto.ExamTimeEntryResponse;
import com.deutschbridge.backend.model.dto.ExamTimeSettingsResponse;
import com.deutschbridge.backend.model.dto.ExamTimeUpdateRequest;
import com.deutschbridge.backend.model.entity.ExamConfiguration;
import com.deutschbridge.backend.model.entity.ExamTimeConfiguration;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.ExamConfigurationRepository;
import com.deutschbridge.backend.repository.ExamTimeConfigurationRepository;
import com.deutschbridge.backend.service.ExamTimeDefaults.Part;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Admin management and learner lookup of the exam timing configuration. Telc and DTZ are configurable; every query is scoped to one
 * exam type. The methods without an exam type are the Telc ones.
 */
@Service
public class ExamTimeConfigurationService {

    static final int MIN_MINUTES = 1;

    private static final String NOT_FOUND_MSG = "Time configuration not found!";

    private final ExamTimeConfigurationRepository timeRepository;
    private final ExamConfigurationRepository examConfigurationRepository;
    private final int maxMinutes;
    private final int maxTotalMinutes;

    public ExamTimeConfigurationService(ExamTimeConfigurationRepository timeRepository,
                                        ExamConfigurationRepository examConfigurationRepository,
                                        @Value("${exam.time.max-minutes:180}") int maxMinutes,
                                        @Value("${exam.time.max-total-minutes:300}") int maxTotalMinutes) {
        this.timeRepository = timeRepository;
        this.examConfigurationRepository = examConfigurationRepository;
        this.maxMinutes = maxMinutes;
        this.maxTotalMinutes = maxTotalMinutes;
    }

    // ---- learner ----

    /** Enabled Teil targets for a level. Empty when nothing is configured - callers must treat that as "no timing". */
    public List<ExamTimeConfigurationResponse> findEnabledForLevel(LearningLevel level) {
        return findEnabledForLevel(ExamType.TELC, level);
    }

    public List<ExamTimeConfigurationResponse> findEnabledForLevel(ExamType examType, LearningLevel level) {
        return timeRepository.findByExamTypeAndLevel(requireTimed(examType), level).stream()
                .filter(ExamTimeConfiguration::isEnabled)
                .map(ExamTimeConfigurationService::toLearnerResponse)
                .toList();
    }

    public ExamTimeConfigurationResponse findEnabled(LearningLevel level, ExamSection section, int teil)
            throws DataNotFoundException {
        return findEnabled(ExamType.TELC, level, section, teil);
    }

    public ExamTimeConfigurationResponse findEnabled(ExamType examType, LearningLevel level, ExamSection section, int teil)
            throws DataNotFoundException {
        return findEnabledEntity(examType, level, section, teil)
                .map(ExamTimeConfigurationService::toLearnerResponse)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
    }

    /** The Teil's target in seconds, or empty if it is missing or disabled. */
    public Optional<Integer> targetSeconds(LearningLevel level, ExamSection section, int teil) {
        return targetSeconds(ExamType.TELC, level, section, teil);
    }

    public Optional<Integer> targetSeconds(ExamType examType, LearningLevel level, ExamSection section, int teil) {
        return findEnabledEntity(examType, level, section, teil).map(c -> c.getRecommendedMinutes() * 60);
    }

    private Optional<ExamTimeConfiguration> findEnabledEntity(ExamType examType, LearningLevel level, ExamSection section, int teil) {
        if (!ExamTimeDefaults.TIMED_EXAMS.contains(examType)) return Optional.empty();
        return timeRepository.findByExamTypeAndLevelAndSectionAndTeil(examType, level, section, teil)
                .filter(ExamTimeConfiguration::isEnabled);
    }

    // ---- admin ----

    public ExamTimeSettingsResponse getSettings(LearningLevel level) {
        return getSettings(ExamType.TELC, level);
    }

    public ExamTimeSettingsResponse getSettings(ExamType examType, LearningLevel level) {
        requireTimed(examType);
        List<ExamTimeConfiguration> rows = timeRepository.findByExamTypeAndLevel(examType, level);
        Integer total = examConfigurationRepository.findByExamTypeAndLevel(examType, level)
                .filter(ExamConfiguration::isEnabled)
                .map(ExamConfiguration::getTotalDurationMinutes)
                .orElse(null);
        return buildSettings(examType, level, rows, total);
    }

    @Transactional
    public ExamTimeSettingsResponse saveSettings(ExamTimeBulkUpdateRequest request) {
        if (request == null || request.level() == null) {
            throw new IllegalArgumentException("Level is required");
        }
        List<ExamTimeBulkUpdateRequest.Entry> entries = request.configurations() != null ? request.configurations() : List.of();
        LearningLevel level = request.level();
        ExamType examType = requireTimed(request.examType() != null ? request.examType() : ExamType.TELC);

        Map<Part, ExamTimeConfiguration> existing = existingByPart(examType, level);
        Integer newTotal = request.totalDurationMinutes() != null
                ? validateTotal(request.totalDurationMinutes())
                : null;

        // Validate everything first so a bad value never leaves a half-saved level behind.
        Map<Part, Integer> minutes = new LinkedHashMap<>();
        Map<Part, Boolean> enabled = new LinkedHashMap<>();
        Set<Part> seen = new HashSet<>();
        for (ExamTimeBulkUpdateRequest.Entry entry : entries) {
            Part part = requirePart(examType, entry.section(), entry.teil());
            if (!seen.add(part)) {
                throw new IllegalArgumentException("Duplicate configuration for " + describe(part) + ".");
            }
            minutes.put(part, validateMinutes(entry.recommendedMinutes(), part));
            enabled.put(part, entry.enabled() == null || entry.enabled());
        }

        Map<Part, Integer> effective = effectiveEnabledMinutes(existing, minutes, enabled);
        Integer effectiveTotal = newTotal != null ? newTotal : currentTotal(examType, level).orElse(null);
        requireWithinTotal(effective, effectiveTotal);

        minutes.forEach((part, value) -> {
            ExamTimeConfiguration row = existing.getOrDefault(part, newRow(examType, level, part));
            row.setRecommendedMinutes(value);
            row.setEnabled(enabled.get(part));
            timeRepository.save(row);
        });
        if (newTotal != null) {
            upsertTotal(examType, level, newTotal);
        }
        return getSettings(examType, level);
    }

    @Transactional
    public ExamTimeSettingsResponse update(String id, ExamTimeUpdateRequest request) throws DataNotFoundException {
        ExamTimeConfiguration row = timeRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
        Part part = new Part(row.getSection(), row.getTeil());

        int newMinutes = request.recommendedMinutes() != null
                ? validateMinutes(request.recommendedMinutes(), part)
                : row.getRecommendedMinutes();
        boolean newEnabled = request.enabled() != null ? request.enabled() : row.isEnabled();

        Map<Part, ExamTimeConfiguration> existing = existingByPart(row.getExamType(), row.getLevel());
        Map<Part, Integer> effective = effectiveEnabledMinutes(existing, Map.of(part, newMinutes), Map.of(part, newEnabled));
        requireWithinTotal(effective, currentTotal(row.getExamType(), row.getLevel()).orElse(null));

        row.setRecommendedMinutes(newMinutes);
        row.setEnabled(newEnabled);
        timeRepository.save(row);
        return getSettings(row.getExamType(), row.getLevel());
    }

    /** Restores a level to the built-in training defaults; levels without defaults are cleared. */
    @Transactional
    public ExamTimeSettingsResponse resetToDefaults(LearningLevel level) {
        return resetToDefaults(ExamType.TELC, level);
    }

    @Transactional
    public ExamTimeSettingsResponse resetToDefaults(ExamType examType, LearningLevel level) {
        requireTimed(examType);
        timeRepository.deleteByExamTypeAndLevel(examType, level);
        timeRepository.flush();
        examConfigurationRepository.findByExamTypeAndLevel(examType, level).ifPresent(examConfigurationRepository::delete);
        examConfigurationRepository.flush();
        insertMissingDefaults(examType, level);
        return getSettings(examType, level);
    }

    /** Inserts the built-in defaults for any level that has none yet. Never overwrites admin edits. */
    @Transactional
    public void seedDefaults() {
        List.of(ExamType.TELC, ExamType.DTZ).forEach(this::seedDefaults);
    }

    @Transactional
    public void seedDefaults(ExamType examType) {
        ExamTimeDefaults.defaultMinutes(examType).keySet().forEach(level -> insertMissingDefaults(examType, level));
    }

    private void insertMissingDefaults(ExamType examType, LearningLevel level) {
        Map<Part, Integer> defaults = ExamTimeDefaults.defaultMinutes(examType).get(level);
        if (defaults == null) return;
        Map<Part, ExamTimeConfiguration> existing = existingByPart(examType, level);
        ExamTimeDefaults.supportedParts(examType).stream()
                .filter(part -> defaults.containsKey(part) && !existing.containsKey(part))
                .forEach(part -> {
                    ExamTimeConfiguration row = newRow(examType, level, part);
                    row.setRecommendedMinutes(defaults.get(part));
                    timeRepository.save(row);
                });
        Integer total = ExamTimeDefaults.defaultTotalMinutes(examType).get(level);
        if (total != null && currentTotal(examType, level).isEmpty()) {
            upsertTotal(examType, level, total);
        }
    }

    // ---- validation ----

    private int validateMinutes(BigDecimal value, Part part) {
        return requireWholeNumberInRange(value, MIN_MINUTES, maxMinutes, describe(part));
    }

    private int validateTotal(BigDecimal value) {
        return requireWholeNumberInRange(value, MIN_MINUTES, maxTotalMinutes, "the exam duration");
    }

    private static int requireWholeNumberInRange(BigDecimal value, int min, int max, String what) {
        boolean whole = value != null && value.stripTrailingZeros().scale() <= 0;
        if (!whole || value.compareTo(BigDecimal.valueOf(min)) < 0 || value.compareTo(BigDecimal.valueOf(max)) > 0) {
            throw new IllegalArgumentException(
                    "Please enter a whole number between " + min + " and " + max + " minutes for " + what + ".");
        }
        return value.intValueExact();
    }

    private static ExamType requireTimed(ExamType examType) {
        if (!ExamTimeDefaults.TIMED_EXAMS.contains(examType)) {
            throw new IllegalArgumentException("Exam times are not available for " + examType + ".");
        }
        return examType;
    }

    private static Part requirePart(ExamType examType, ExamSection section, Integer teil) {
        if (section == null || teil == null || !ExamTimeDefaults.isSupported(examType, section, teil)) {
            throw new IllegalArgumentException("Unsupported exam part: " + section + " Teil " + teil + ".");
        }
        return new Part(section, teil);
    }

    private static void requireWithinTotal(Map<Part, Integer> effectiveMinutes, Integer total) {
        if (total == null) return;
        int sum = sumTowardsTotal(effectiveMinutes);
        if (sum > total) {
            throw new IllegalArgumentException(
                    "Configuration exceeds exam duration by " + (sum - total) + " minutes.");
        }
    }

    // ---- helpers ----

    private Map<Part, ExamTimeConfiguration> existingByPart(ExamType examType, LearningLevel level) {
        Map<Part, ExamTimeConfiguration> byPart = new LinkedHashMap<>();
        timeRepository.findByExamTypeAndLevel(examType, level)
                .forEach(row -> byPart.put(new Part(row.getSection(), row.getTeil()), row));
        return byPart;
    }

    /** Minutes of every enabled part after applying the pending changes on top of what is stored. */
    private static Map<Part, Integer> effectiveEnabledMinutes(Map<Part, ExamTimeConfiguration> existing,
                                                              Map<Part, Integer> pendingMinutes,
                                                              Map<Part, Boolean> pendingEnabled) {
        Map<Part, Integer> result = new LinkedHashMap<>();
        existing.forEach((part, row) -> {
            if (row.isEnabled()) result.put(part, row.getRecommendedMinutes());
        });
        pendingMinutes.forEach((part, value) -> {
            if (pendingEnabled.get(part)) result.put(part, value);
            else result.remove(part);
        });
        return result;
    }

    private static int sumTowardsTotal(Map<Part, Integer> minutes) {
        return minutes.entrySet().stream()
                .filter(e -> !ExamTimeDefaults.OUTSIDE_TOTAL_DURATION.contains(e.getKey().section()))
                .mapToInt(Map.Entry::getValue)
                .sum();
    }

    private Optional<Integer> currentTotal(ExamType examType, LearningLevel level) {
        return examConfigurationRepository.findByExamTypeAndLevel(examType, level)
                .filter(ExamConfiguration::isEnabled)
                .map(ExamConfiguration::getTotalDurationMinutes);
    }

    private void upsertTotal(ExamType examType, LearningLevel level, int total) {
        ExamConfiguration config = examConfigurationRepository.findByExamTypeAndLevel(examType, level)
                .orElseGet(() -> {
                    ExamConfiguration created = new ExamConfiguration();
                    created.setExamType(examType);
                    created.setLevel(level);
                    return created;
                });
        config.setTotalDurationMinutes(total);
        config.setEnabled(true);
        examConfigurationRepository.save(config);
    }

    private static ExamTimeConfiguration newRow(ExamType examType, LearningLevel level, Part part) {
        ExamTimeConfiguration row = new ExamTimeConfiguration();
        row.setExamType(examType);
        row.setLevel(level);
        row.setSection(part.section());
        row.setTeil(part.teil());
        return row;
    }

    private ExamTimeSettingsResponse buildSettings(ExamType examType, LearningLevel level, List<ExamTimeConfiguration> rows, Integer total) {
        Map<Part, ExamTimeConfiguration> byPart = new LinkedHashMap<>();
        rows.forEach(row -> byPart.put(new Part(row.getSection(), row.getTeil()), row));

        List<ExamTimeEntryResponse> entries = ExamTimeDefaults.supportedParts(examType).stream()
                .map(part -> {
                    ExamTimeConfiguration row = byPart.get(part);
                    return row == null
                            ? new ExamTimeEntryResponse(null, part.section().name(), part.teil(), null, true)
                            : new ExamTimeEntryResponse(row.getId(), part.section().name(), part.teil(),
                                    row.getRecommendedMinutes(), row.isEnabled());
                })
                .toList();

        Map<Part, Integer> enabledMinutes = new LinkedHashMap<>();
        byPart.forEach((part, row) -> {
            if (row.isEnabled()) enabledMinutes.put(part, row.getRecommendedMinutes());
        });
        int configured = sumTowardsTotal(enabledMinutes);

        return new ExamTimeSettingsResponse(examType.name(), level.getValue(), total, configured,
                total != null ? total - configured : null, MIN_MINUTES, maxMinutes, maxTotalMinutes, entries);
    }

    private static String describe(Part part) {
        return part.section().name() + " Teil " + part.teil();
    }

    private static ExamTimeConfigurationResponse toLearnerResponse(ExamTimeConfiguration c) {
        return new ExamTimeConfigurationResponse(c.getExamType().name(), c.getLevel().getValue(),
                c.getSection().name(), c.getTeil(), c.getRecommendedMinutes());
    }
}
