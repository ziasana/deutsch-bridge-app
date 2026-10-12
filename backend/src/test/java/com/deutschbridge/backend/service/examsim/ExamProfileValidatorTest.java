package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.model.entity.ExamProfile;
import com.deutschbridge.backend.model.enums.OverallResultPolicy;
import com.deutschbridge.backend.model.enums.PartScoringMethod;
import com.deutschbridge.backend.model.examsim.ExamPartConfig;
import com.deutschbridge.backend.model.examsim.ExamProfileConfig;
import com.deutschbridge.backend.model.examsim.RubricCriterion;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.function.UnaryOperator;

import static com.deutschbridge.backend.service.examsim.ExamSimulationFixtures.telcProfile;
import static org.junit.jupiter.api.Assertions.*;

class ExamProfileValidatorTest {

    private final ExamProfileValidator validator = new ExamProfileValidator();

    private static BigDecimal bd(String v) {
        return new BigDecimal(v);
    }

    private ExamProfile withParts(UnaryOperator<List<ExamPartConfig>> edit) {
        ExamProfile p = telcProfile();
        ExamProfileConfig c = p.getConfig();
        p.setConfig(new ExamProfileConfig(edit.apply(new ArrayList<>(c.parts())), c.timers(), c.scoreScale(), c.roundingMode()));
        return p;
    }

    private static ExamPartConfig replace(ExamPartConfig o, Integer questions, BigDecimal perQuestion, BigDecimal max, String timer, List<RubricCriterion> rubric) {
        return new ExamPartConfig(o.key(), o.label(), o.module(), o.section(), o.teil(), o.taskTypes(), o.exerciseCount(), questions, perQuestion, max,
                o.scoringMethod(), timer, rubric);
    }

    private static boolean hasError(ProfileValidationResult r, String code) {
        return r.errors().stream().anyMatch(e -> e.code().equals(code));
    }

    @Test
    @DisplayName("The seeded telc B1 profile is structurally valid and totals 300 points")
    void telcProfileIsValid() {
        ExamProfile p = telcProfile();
        ProfileValidationResult r = validator.validate(p);
        assertTrue(r.isValid(), r.errors().toString());
        assertEquals(0, bd("300").compareTo(p.getWrittenMaxPoints().add(p.getOralMaxPoints())));
        // oral is unscored in V1 while the overall result needs an oral pass -> the admin is warned
        assertTrue(r.warnings().stream().anyMatch(w -> w.code().equals("OVERALL_WILL_STAY_INCOMPLETE")));
    }

    @Test
    @DisplayName("questions x points per question must equal the part maximum")
    void pointsMismatch() {
        ExamProfile p = withParts(parts -> {
            parts.set(2, replace(parts.get(2), 10, bd("2"), bd("25"), "LESEN_SPRACHBAUSTEINE", null));
            return parts;
        });
        assertTrue(hasError(validator.validate(p), "PART_POINTS_MISMATCH"));
    }

    @Test
    @DisplayName("Declared written/oral maximums must equal the sum of their parts")
    void totalsMustMatch() {
        ExamProfile p = telcProfile();
        p.setWrittenMaxPoints(bd("230"));
        p.setOralMaxPoints(bd("70"));
        ProfileValidationResult r = validator.validate(p);
        assertTrue(hasError(r, "WRITTEN_SUM_MISMATCH"));
        assertTrue(hasError(r, "ORAL_SUM_MISMATCH"));
    }

    @Test
    @DisplayName("Pass thresholds must lie between 0 and the maximum")
    void thresholds() {
        ExamProfile p = telcProfile();
        p.setWrittenPassThreshold(bd("226"));
        p.setOralPassThreshold(bd("-1"));
        ProfileValidationResult r = validator.validate(p);
        assertTrue(hasError(r, "WRITTEN_THRESHOLD_INVALID"));
        assertTrue(hasError(r, "ORAL_THRESHOLD_INVALID"));
    }

    @Test
    @DisplayName("Writing rubric criteria must add up to the writing maximum")
    void rubricSum() {
        ExamProfile p = withParts(parts -> {
            int i = 8;
            parts.set(i, replace(parts.get(i), null, null, bd("45"), "SCHREIBEN",
                    List.of(new RubricCriterion("A", "A", null, bd("15")), new RubricCriterion("B", "B", null, bd("15")), new RubricCriterion("C", "C", null, bd("10")))));
            return parts;
        });
        assertTrue(hasError(validator.validate(p), "RUBRIC_SUM_MISMATCH"));
    }

    @Test
    @DisplayName("Manually assessed parts need a rubric")
    void rubricRequired() {
        ExamProfile p = withParts(parts -> {
            parts.set(8, replace(parts.get(8), null, null, bd("45"), "SCHREIBEN", List.of()));
            return parts;
        });
        assertTrue(hasError(validator.validate(p), "PART_RUBRIC_REQUIRED"));
    }

    @Test
    @DisplayName("Parts must reference existing timers, keys must be unique and part order must follow timer order")
    void timersAndKeys() {
        ExamProfile unknown = withParts(parts -> {
            parts.set(0, replace(parts.get(0), 5, bd("5"), bd("25"), "GIBT_ES_NICHT", null));
            return parts;
        });
        assertTrue(hasError(validator.validate(unknown), "PART_TIMER_UNKNOWN"));

        ExamProfile dup = withParts(parts -> {
            parts.set(1, replace(parts.get(0), 5, bd("5"), bd("25"), "LESEN_SPRACHBAUSTEINE", null));
            return parts;
        });
        assertTrue(hasError(validator.validate(dup), "PART_KEY_DUPLICATE"));

        ExamProfile order = withParts(parts -> {
            parts.set(0, replace(parts.get(0), 5, bd("5"), bd("25"), "HOEREN", null)); // first part in a later timer than its successors
            return parts;
        });
        assertTrue(hasError(validator.validate(order), "PART_ORDER_TIMER_MISMATCH"));
    }

    @Test
    @DisplayName("Timer minutes and rounding settings are validated")
    void timerAndRounding() {
        ExamProfile p = telcProfile();
        ExamProfileConfig c = p.getConfig();
        List<com.deutschbridge.backend.model.examsim.ExamTimerConfig> timers = new ArrayList<>(c.timers());
        timers.set(1, new com.deutschbridge.backend.model.examsim.ExamTimerConfig("HOEREN", "Hören", 0, null, null));
        p.setConfig(new ExamProfileConfig(c.parts(), timers, 9, "SIDEWAYS"));
        ProfileValidationResult r = validator.validate(p);
        assertTrue(hasError(r, "TIMER_MINUTES_INVALID"));
        assertTrue(hasError(r, "SCALE_INVALID"));
        assertTrue(hasError(r, "ROUNDING_MODE_INVALID"));
    }

    @Test
    @DisplayName("With oral scoring enabled oral parts must be manually assessed")
    void oralScoringNeedsAssessment() {
        ExamProfile p = withParts(parts -> {
            ExamPartConfig o = parts.get(9);
            parts.set(9, new ExamPartConfig(o.key(), o.label(), o.module(), o.section(), o.teil(), null, 1, null, null, o.maxPoints(),
                    PartScoringMethod.UNSCORED, o.timerKey(), null));
            return parts;
        });
        p.setOralScoringEnabled(true);
        assertTrue(hasError(validator.validate(p), "ORAL_SCORING_NEEDS_ASSESSMENT"));
    }

    @Test
    @DisplayName("Empty / missing configuration is rejected")
    void missingConfig() {
        ExamProfile p = telcProfile();
        p.setConfig(null);
        assertTrue(hasError(validator.validate(p), "PARTS_REQUIRED"));
        ExamProfile q = telcProfile();
        q.setTitle(" ");
        q.setOverallResultPolicy(null);
        ProfileValidationResult r = validator.validate(q);
        assertTrue(hasError(r, "TITLE_REQUIRED"));
        assertTrue(hasError(r, "OVERALL_POLICY_REQUIRED"));
        assertNotEquals(OverallResultPolicy.WRITTEN_ONLY, q.getOverallResultPolicy());
    }

    @Test
    @DisplayName("Audio play limits must be positive; on non-listening parts they only warn")
    void audioPlayLimits() {
        ExamProfile bad = withParts(parts -> {
            ExamPartConfig h = parts.get(5);
            parts.set(5, new ExamPartConfig(h.key(), h.label(), h.module(), h.section(), h.teil(), null, 1, h.questionCount(), h.pointsPerQuestion(), h.maxPoints(), h.scoringMethod(), h.timerKey(), null, 0));
            return parts;
        });
        assertTrue(hasError(validator.validate(bad), "PART_AUDIO_PLAYS_INVALID"));
        ExamProfile ignored = withParts(parts -> {
            ExamPartConfig l = parts.get(0);
            parts.set(0, new ExamPartConfig(l.key(), l.label(), l.module(), l.section(), l.teil(), null, 1, l.questionCount(), l.pointsPerQuestion(), l.maxPoints(), l.scoringMethod(), l.timerKey(), null, 2));
            return parts;
        });
        ProfileValidationResult r = validator.validate(ignored);
        assertTrue(r.isValid());
        assertTrue(r.warnings().stream().anyMatch(w -> w.code().equals("PART_AUDIO_PLAYS_IGNORED")));
    }
}
