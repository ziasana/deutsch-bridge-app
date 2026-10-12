package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.model.entity.ExamProfile;
import com.deutschbridge.backend.model.enums.ExamPartModule;
import com.deutschbridge.backend.model.enums.PartScoringMethod;
import com.deutschbridge.backend.model.examsim.ExamPartConfig;
import com.deutschbridge.backend.model.examsim.ExamProfileConfig;
import com.deutschbridge.backend.model.examsim.ExamTimerConfig;
import com.deutschbridge.backend.model.examsim.RubricCriterion;
import com.deutschbridge.backend.service.examsim.ProfileValidationResult.Issue;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Structural validation of an exam profile. Pure: content availability is checked separately by
 * {@link ExamPoolService}, which needs the database. An invalid profile can never be published, so it can
 * never generate an exam.
 */
@Component
public class ExamProfileValidator {

    public ProfileValidationResult validate(ExamProfile p) {
        List<Issue> errors = new ArrayList<>();
        List<Issue> warnings = new ArrayList<>();

        require(errors, notBlank(p.getCode()), "CODE_REQUIRED", "code", "Profile code is required.");
        require(errors, notBlank(p.getProvider()), "PROVIDER_REQUIRED", "provider", "Provider is required.");
        require(errors, notBlank(p.getExamName()), "EXAM_NAME_REQUIRED", "examName", "Exam name is required.");
        require(errors, notBlank(p.getTitle()), "TITLE_REQUIRED", "title", "Title is required.");
        require(errors, p.getLevel() != null, "LEVEL_REQUIRED", "level", "Level is required.");
        require(errors, p.getOverallResultPolicy() != null, "OVERALL_POLICY_REQUIRED", "overallResultPolicy", "Overall result policy is required.");
        require(errors, p.getAnswerReleasePolicy() != null, "RELEASE_POLICY_REQUIRED", "answerReleasePolicy", "Answer release policy is required.");

        ExamProfileConfig config = p.getConfig();
        if (config == null || config.partsOrEmpty().isEmpty()) {
            errors.add(new Issue("PARTS_REQUIRED", "config.parts", "At least one exam part is required."));
            return new ProfileValidationResult(errors, warnings);
        }

        validateRounding(config, errors);
        Set<String> timerKeys = validateTimers(config, errors);
        validateParts(p, config, timerKeys, errors, warnings);
        validateTotals(p, config, errors, warnings);
        return new ProfileValidationResult(errors, warnings);
    }

    private void validateRounding(ExamProfileConfig config, List<Issue> errors) {
        if (config.scale() < 0 || config.scale() > 3) {
            errors.add(new Issue("SCALE_INVALID", "config.scoreScale", "Score scale must be between 0 and 3 decimal places."));
        }
        if (config.roundingMode() != null && !config.roundingMode().isBlank()) {
            try {
                RoundingMode.valueOf(config.roundingMode().trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                errors.add(new Issue("ROUNDING_MODE_INVALID", "config.roundingMode", "Unknown rounding mode: " + config.roundingMode()));
            }
        }
    }

    private Set<String> validateTimers(ExamProfileConfig config, List<Issue> errors) {
        Set<String> keys = new HashSet<>();
        List<ExamTimerConfig> timers = config.timersOrEmpty();
        if (timers.isEmpty()) {
            errors.add(new Issue("TIMERS_REQUIRED", "config.timers", "At least one timer is required."));
            return keys;
        }
        for (int i = 0; i < timers.size(); i++) {
            ExamTimerConfig t = timers.get(i);
            String path = "config.timers[" + i + "]";
            if (!notBlank(t.key())) {
                errors.add(new Issue("TIMER_KEY_REQUIRED", path + ".key", "Timer key is required."));
                continue;
            }
            if (!keys.add(t.key())) {
                errors.add(new Issue("TIMER_KEY_DUPLICATE", path + ".key", "Duplicate timer key: " + t.key()));
            }
            if (t.minutes() <= 0 || t.minutes() > 600) {
                errors.add(new Issue("TIMER_MINUTES_INVALID", path + ".minutes", "Timer minutes must be between 1 and 600."));
            }
        }
        for (int i = 0; i < timers.size(); i++) {
            ExamTimerConfig t = timers.get(i);
            if (t.isPreparation()) {
                if (!notBlank(t.previewTimerKey()) || !keys.contains(t.previewTimerKey())) {
                    errors.add(new Issue("TIMER_PREVIEW_UNKNOWN", "config.timers[" + i + "].previewTimerKey", "A preparation timer must reference an existing timer."));
                } else if (indexOfTimer(timers, t.previewTimerKey()) <= i) {
                    errors.add(new Issue("TIMER_PREVIEW_ORDER", "config.timers[" + i + "].previewTimerKey", "A preparation timer must run before the timer it prepares."));
                }
            }
        }
        return keys;
    }

    private void validateParts(ExamProfile p, ExamProfileConfig config, Set<String> timerKeys, List<Issue> errors, List<Issue> warnings) {
        Set<String> partKeys = new HashSet<>();
        Set<String> usedTimers = new HashSet<>();
        int lastTimerIndex = -1;
        List<ExamPartConfig> parts = config.partsOrEmpty();
        for (int i = 0; i < parts.size(); i++) {
            ExamPartConfig part = parts.get(i);
            String path = "config.parts[" + i + "]";
            if (!notBlank(part.key())) {
                errors.add(new Issue("PART_KEY_REQUIRED", path + ".key", "Part key is required."));
                continue;
            }
            if (!partKeys.add(part.key())) errors.add(new Issue("PART_KEY_DUPLICATE", path + ".key", "Duplicate part key: " + part.key()));
            if (part.module() == null) errors.add(new Issue("PART_MODULE_REQUIRED", path + ".module", "Part module (WRITTEN/ORAL) is required."));
            if (part.section() == null) errors.add(new Issue("PART_SECTION_REQUIRED", path + ".section", "Exercise section is required."));
            if (part.teil() < 1) errors.add(new Issue("PART_TEIL_INVALID", path + ".teil", "Teil must be 1 or higher."));
            if (part.maxPoints() == null || part.maxPoints().signum() < 0) {
                errors.add(new Issue("PART_MAX_INVALID", path + ".maxPoints", "Maximum points must be zero or more."));
            }
            if (part.scoringMethod() == null) {
                errors.add(new Issue("PART_METHOD_REQUIRED", path + ".scoringMethod", "Scoring method is required."));
                continue;
            }
            if (!notBlank(part.timerKey()) || !timerKeys.contains(part.timerKey())) {
                errors.add(new Issue("PART_TIMER_UNKNOWN", path + ".timerKey", "Part references an unknown timer: " + part.timerKey()));
            } else {
                int idx = indexOfTimer(config.timersOrEmpty(), part.timerKey());
                if (idx < lastTimerIndex) {
                    errors.add(new Issue("PART_ORDER_TIMER_MISMATCH", path + ".timerKey", "Part order must follow timer order; " + part.key() + " belongs to an earlier timer than the preceding part."));
                }
                lastTimerIndex = Math.max(lastTimerIndex, idx);
                usedTimers.add(part.timerKey());
            }
            validateScoring(p, part, path, errors);
        }
        for (ExamTimerConfig t : config.timersOrEmpty()) {
            if (!t.isPreparation() && notBlank(t.key()) && !usedTimers.contains(t.key())) {
                warnings.add(new Issue("TIMER_UNUSED", "config.timers", "Timer " + t.key() + " has no parts."));
            }
        }
    }

    private void validateScoring(ExamProfile p, ExamPartConfig part, String path, List<Issue> errors) {
        PartScoringMethod method = part.scoringMethod();
        BigDecimal max = part.maxPoints() != null ? part.maxPoints() : BigDecimal.ZERO;
        switch (method) {
            case PER_QUESTION -> {
                if (part.questionCount() == null || part.questionCount() < 1) {
                    errors.add(new Issue("PART_QUESTIONS_REQUIRED", path + ".questionCount", "Question count is required for per-question scoring."));
                } else if (part.pointsPerQuestion() == null || part.pointsPerQuestion().signum() <= 0) {
                    errors.add(new Issue("PART_POINTS_PER_QUESTION_REQUIRED", path + ".pointsPerQuestion", "Points per question must be positive."));
                } else if (part.pointsPerQuestion().multiply(BigDecimal.valueOf(part.questionCount())).compareTo(max) != 0) {
                    errors.add(new Issue("PART_POINTS_MISMATCH", path, part.key() + ": " + part.questionCount() + " questions x "
                            + part.pointsPerQuestion().stripTrailingZeros().toPlainString() + " points does not equal the maximum of "
                            + max.stripTrailingZeros().toPlainString() + "."));
                }
                if (part.questionCount() != null && part.questionCount() % part.effectiveExerciseCount() != 0) {
                    errors.add(new Issue("PART_QUESTIONS_NOT_DIVISIBLE", path + ".questionCount", "Question count must be divisible by the number of exercises."));
                }
            }
            case MANUAL_RUBRIC -> {
                List<RubricCriterion> rubric = part.rubricOrEmpty();
                if (rubric.isEmpty()) {
                    errors.add(new Issue("PART_RUBRIC_REQUIRED", path + ".rubric", part.key() + ": manually assessed parts need rubric criteria."));
                } else {
                    BigDecimal sum = BigDecimal.ZERO;
                    Set<String> criterionKeys = new HashSet<>();
                    for (RubricCriterion c : rubric) {
                        if (c.key() == null || c.key().isBlank() || !criterionKeys.add(c.key())) {
                            errors.add(new Issue("RUBRIC_KEY_INVALID", path + ".rubric", part.key() + ": rubric criteria need unique keys."));
                        }
                        if (c.maxPoints() == null || c.maxPoints().signum() <= 0) {
                            errors.add(new Issue("RUBRIC_MAX_INVALID", path + ".rubric", part.key() + ": every criterion needs positive maximum points."));
                        } else {
                            sum = sum.add(c.maxPoints());
                        }
                    }
                    if (sum.compareTo(max) != 0) {
                        errors.add(new Issue("RUBRIC_SUM_MISMATCH", path + ".rubric", part.key() + ": criteria maximums add up to "
                                + sum.stripTrailingZeros().toPlainString() + " but the part maximum is " + max.stripTrailingZeros().toPlainString() + "."));
                    }
                }
            }
            case UNSCORED -> {
                if (part.module() == ExamPartModule.WRITTEN && max.signum() > 0) {
                    errors.add(new Issue("PART_UNSCORED_WRITTEN_POINTS", path, part.key() + ": an unscored written part cannot carry points."));
                }
            }
        }
        if (p.isOralScoringEnabled() && part.module() == ExamPartModule.ORAL && method != PartScoringMethod.MANUAL_RUBRIC) {
            errors.add(new Issue("ORAL_SCORING_NEEDS_ASSESSMENT", path + ".scoringMethod", part.key() + ": oral scoring is enabled, so oral parts must be manually assessed."));
        }
    }

    private void validateTotals(ExamProfile p, ExamProfileConfig config, List<Issue> errors, List<Issue> warnings) {
        BigDecimal written = sum(config, ExamPartModule.WRITTEN);
        BigDecimal oral = sum(config, ExamPartModule.ORAL);
        checkTotal(errors, "WRITTEN", p.getWrittenMaxPoints(), written, p.getWrittenPassThreshold());
        checkTotal(errors, "ORAL", p.getOralMaxPoints(), oral, p.getOralPassThreshold());
        if (oral.signum() == 0 && config.partsOrEmpty().stream().noneMatch(x -> x.module() == ExamPartModule.ORAL)) {
            warnings.add(new Issue("NO_ORAL_PARTS", "config.parts", "The profile has no oral parts."));
        }
        if (!p.isOralScoringEnabled() && p.getOverallResultPolicy() == com.deutschbridge.backend.model.enums.OverallResultPolicy.WRITTEN_AND_ORAL_REQUIRED) {
            warnings.add(new Issue("OVERALL_WILL_STAY_INCOMPLETE", "overallResultPolicy",
                    "Oral scoring is disabled while the overall result requires an oral pass: the overall result will stay incomplete."));
        }
    }

    private void checkTotal(List<Issue> errors, String name, BigDecimal declaredMax, BigDecimal partSum, BigDecimal threshold) {
        String lower = name.toLowerCase();
        if (declaredMax == null || declaredMax.signum() < 0) {
            errors.add(new Issue(name + "_MAX_INVALID", lower + "MaxPoints", name + " maximum must be zero or more."));
            return;
        }
        if (declaredMax.compareTo(partSum) != 0) {
            errors.add(new Issue(name + "_SUM_MISMATCH", lower + "MaxPoints", name + " parts add up to " + partSum.stripTrailingZeros().toPlainString()
                    + " points but the declared " + lower + " maximum is " + declaredMax.stripTrailingZeros().toPlainString() + "."));
        }
        if (threshold == null || threshold.signum() < 0 || threshold.compareTo(declaredMax) > 0) {
            errors.add(new Issue(name + "_THRESHOLD_INVALID", lower + "PassThreshold", name + " pass threshold must be between 0 and the maximum."));
        }
    }

    private BigDecimal sum(ExamProfileConfig config, ExamPartModule module) {
        return config.partsOrEmpty().stream()
                .filter(x -> x.module() == module && x.maxPoints() != null)
                .map(ExamPartConfig::maxPoints)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private int indexOfTimer(List<ExamTimerConfig> timers, String key) {
        for (int i = 0; i < timers.size(); i++) if (key.equals(timers.get(i).key())) return i;
        return -1;
    }

    private static void require(List<Issue> errors, boolean ok, String code, String path, String message) {
        if (!ok) errors.add(new Issue(code, path, message));
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
