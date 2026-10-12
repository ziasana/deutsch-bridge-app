package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.model.enums.ExamResultStatus;
import com.deutschbridge.backend.model.enums.OverallResultPolicy;
import com.deutschbridge.backend.model.enums.PartResultStatus;
import com.deutschbridge.backend.model.examsim.ExamProfileConfig;
import com.deutschbridge.backend.model.examsim.ExamResult;
import com.deutschbridge.backend.model.examsim.PartResult;
import com.deutschbridge.backend.model.examsim.ProfileSnapshot;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import static com.deutschbridge.backend.service.examsim.ExamSimulationFixtures.*;
import static org.junit.jupiter.api.Assertions.*;

class ExamScoringTest {

    private final ExamResultCalculator calculator = calculator();

    private static BigDecimal bd(String v) {
        return new BigDecimal(v);
    }

    private static PartResult part(ExamResult r, String key) {
        return r.parts().stream().filter(p -> p.key().equals(key)).findFirst().orElseThrow();
    }

    /** Every objective part full marks (180) plus the given writing and oral inputs. */
    private Map<String, ExamResultCalculator.PartInput> fullObjective(ProfileSnapshot profile) {
        Map<String, Integer> correct = new HashMap<>();
        profile.config().partsOrEmpty().stream().filter(p -> p.questionCount() != null).forEach(p -> correct.put(p.key(), p.questionCount()));
        return objectiveInputs(profile, correct);
    }

    @ParameterizedTest(name = "{0}: {1} correct -> {2} points")
    @CsvSource({
            "LESEN_1,5,25", "LESEN_1,3,15", "LESEN_2,5,25", "LESEN_2,1,5",
            "LESEN_3,10,25", "LESEN_3,3,7.5", "LESEN_3,1,2.5",
            "SPRACHBAUSTEINE_1,10,15", "SPRACHBAUSTEINE_1,7,10.5", "SPRACHBAUSTEINE_2,10,15", "SPRACHBAUSTEINE_2,1,1.5",
            "HOEREN_1,5,25", "HOEREN_1,2,10", "HOEREN_2,10,25", "HOEREN_2,5,12.5", "HOEREN_3,5,25", "HOEREN_3,4,20"
    })
    @DisplayName("Configured per-question mappings produce the exact points")
    void perQuestionMappings(String key, int correct, String expected) {
        ProfileSnapshot profile = telcSnapshot(false);
        ExamResult result = calculator.calculate(profile, objectiveInputs(profile, Map.of(key, correct)));
        PartResult p = part(result, key);
        assertEquals(0, bd(expected).compareTo(p.score()), key);
        assertEquals(PartResultStatus.SCORED, p.status());
        assertEquals(correct, p.correct());
    }

    @Test
    @DisplayName("Unanswered and wrong answers are counted separately and score nothing")
    void countsWrongAndUnanswered() {
        ProfileSnapshot profile = telcSnapshot(false);
        var s = snapshot("ex", profile.config().part("LESEN_2").section(), 2, 5);
        Map<String, String> answers = answers(s, 2);
        answers.remove("ex-q5");
        var inputs = new HashMap<>(objectiveInputs(profile, Map.of()));
        inputs.put("LESEN_2", new ExamResultCalculator.PartInput(java.util.List.of(s), answers, false, null));
        PartResult p = part(calculator.calculate(profile, inputs), "LESEN_2");
        assertEquals(2, p.correct());
        assertEquals(2, p.incorrect());
        assertEquals(1, p.unanswered());
        assertEquals(0, bd("10").compareTo(p.score()));
    }

    @Test
    @DisplayName("Answers are compared trimmed and case-insensitively, like the practice flow")
    void answerComparisonIsForgiving() {
        ProfileSnapshot profile = telcSnapshot(false);
        var s = snapshot("ex", profile.config().part("LESEN_2").section(), 2, 5);
        Map<String, String> answers = new HashMap<>();
        s.questions().forEach(q -> answers.put(q.getId(), " a "));
        var inputs = new HashMap<>(objectiveInputs(profile, Map.of()));
        inputs.put("LESEN_2", new ExamResultCalculator.PartInput(java.util.List.of(s), answers, false, null));
        assertEquals(0, bd("25").compareTo(part(calculator.calculate(profile, inputs), "LESEN_2").score()));
    }

    @Test
    @DisplayName("Maximum objective score is 180 and the written maximum 225")
    void maximums() {
        ProfileSnapshot profile = telcSnapshot(false);
        ExamResult r = calculator.calculate(profile, fullObjective(profile));
        assertEquals(0, bd("180").compareTo(r.writtenScore()));
        assertEquals(0, bd("225").compareTo(r.writtenMax()));
        assertEquals(0, bd("300").compareTo(r.totalMax()));
        assertFalse(r.writtenComplete());
    }

    @Test
    @DisplayName("Rounding follows the profile's scale and mode")
    void rounding() {
        ProfileSnapshot base = telcSnapshot(false);
        ProfileSnapshot whole = new ProfileSnapshot(base.profileId(), base.code(), base.version(), base.provider(), base.examName(), base.title(),
                base.examType(), base.level(), false, base.writtenMaxPoints(), base.writtenPassThreshold(), base.oralMaxPoints(), base.oralPassThreshold(),
                base.overallResultPolicy(), base.answerReleasePolicy(), null,
                new ExamProfileConfig(base.config().parts(), base.config().timers(), 0, "HALF_UP"));
        // 7 x 1.5 = 10.5 -> 11 with scale 0 / HALF_UP
        assertEquals(0, bd("11").compareTo(part(calculator.calculate(whole, objectiveInputs(whole, Map.of("SPRACHBAUSTEINE_1", 7))), "SPRACHBAUSTEINE_1").score()));
        ProfileSnapshot down = new ProfileSnapshot(base.profileId(), base.code(), base.version(), base.provider(), base.examName(), base.title(),
                base.examType(), base.level(), false, base.writtenMaxPoints(), base.writtenPassThreshold(), base.oralMaxPoints(), base.oralPassThreshold(),
                base.overallResultPolicy(), base.answerReleasePolicy(), null,
                new ExamProfileConfig(base.config().parts(), base.config().timers(), 0, "HALF_DOWN"));
        assertEquals(0, bd("10").compareTo(part(calculator.calculate(down, objectiveInputs(down, Map.of("SPRACHBAUSTEINE_1", 7))), "SPRACHBAUSTEINE_1").score()));
        // default scale keeps half points
        ProfileSnapshot keep = telcSnapshot(false);
        assertEquals(0, bd("10.5").compareTo(part(calculator.calculate(keep, objectiveInputs(keep, Map.of("SPRACHBAUSTEINE_1", 7))), "SPRACHBAUSTEINE_1").score()));
    }

    @Test
    @DisplayName("Written pass boundary: 135/225 passes, 134.5 does not")
    void writtenBoundary() {
        ProfileSnapshot profile = telcSnapshot(false);
        Map<String, Integer> correct = Map.of("LESEN_1", 5, "LESEN_2", 5, "LESEN_3", 10, "SPRACHBAUSTEINE_1", 10, "SPRACHBAUSTEINE_2", 10, "HOEREN_1", 5); // 130

        var at = new HashMap<>(objectiveInputs(profile, correct));
        at.put("SCHRIFTLICHER_AUSDRUCK", assessed("5"));
        ExamResult passed = calculator.calculate(profile, at);
        assertEquals(0, bd("135").compareTo(passed.writtenScore()));
        assertEquals(ExamResultStatus.PASSED, passed.writtenResult());

        var below = new HashMap<>(objectiveInputs(profile, correct));
        below.put("SCHRIFTLICHER_AUSDRUCK", assessed("4.5"));
        ExamResult failed = calculator.calculate(profile, below);
        assertEquals(0, bd("134.5").compareTo(failed.writtenScore()));
        assertEquals(ExamResultStatus.NOT_PASSED, failed.writtenResult());
        assertEquals(ExamResultStatus.NOT_PASSED, failed.overallResult());
        assertEquals(ExamResultCalculator.EXPLAIN_WRITTEN_FAILED, failed.overallExplanation());
    }

    @Test
    @DisplayName("Unassessed writing is awaiting assessment: no invented score, no pass/fail")
    void writingAwaitingAssessment() {
        ProfileSnapshot profile = telcSnapshot(false);
        var inputs = new HashMap<>(fullObjective(profile));
        inputs.put("SCHRIFTLICHER_AUSDRUCK", unassessed());
        ExamResult r = calculator.calculate(profile, inputs);
        PartResult writing = part(r, "SCHRIFTLICHER_AUSDRUCK");
        assertEquals(PartResultStatus.AWAITING_ASSESSMENT, writing.status());
        assertNull(writing.score());
        assertEquals(ExamResultStatus.AWAITING_ASSESSMENT, r.writtenResult());
        assertEquals(ExamResultStatus.AWAITING_ASSESSMENT, r.overallResult());
        assertTrue(r.pendingAssessmentParts().contains("SCHRIFTLICHER_AUSDRUCK"));
        assertEquals(0, bd("180").compareTo(r.writtenScore()));
    }

    @Test
    @DisplayName("Manual writing assessment completes the written result")
    void manualWritingAssessment() {
        ProfileSnapshot profile = telcSnapshot(false);
        var inputs = new HashMap<>(fullObjective(profile));
        inputs.put("SCHRIFTLICHER_AUSDRUCK", assessed("37.5"));
        ExamResult r = calculator.calculate(profile, inputs);
        assertTrue(r.writtenComplete());
        assertEquals(0, bd("217.5").compareTo(r.writtenScore()));
        assertEquals(0, bd("96.7").compareTo(r.writtenPercentage()));
        assertEquals(ExamResultStatus.PASSED, r.writtenResult());
    }

    @Test
    @DisplayName("V1: unscored oral practice leaves the overall result incomplete even if the written exam is passed")
    void unscoredOralKeepsOverallIncomplete() {
        ProfileSnapshot profile = telcSnapshot(false);
        var inputs = new HashMap<>(fullObjective(profile));
        inputs.put("SCHRIFTLICHER_AUSDRUCK", assessed("40"));
        inputs.put("MUENDLICH_1", new ExamResultCalculator.PartInput(java.util.List.of(), Map.of(), true, null));
        ExamResult r = calculator.calculate(profile, inputs);
        assertEquals(ExamResultStatus.PASSED, r.writtenResult());
        assertEquals(ExamResultStatus.NOT_ASSESSED, r.oralResult());
        assertNull(r.oralScore());
        assertNull(r.totalScore());
        assertEquals(ExamResultStatus.INCOMPLETE, r.overallResult());
        assertEquals(ExamResultCalculator.EXPLAIN_ORAL_NOT_ASSESSED, r.overallExplanation());
        PartResult oral = part(r, "MUENDLICH_1");
        assertEquals(PartResultStatus.NOT_SCORED, oral.status());
        assertTrue(oral.completed());
        assertNull(oral.score());
        assertFalse(r.pendingAssessmentParts().contains("MUENDLICH_1"));
    }

    @Test
    @DisplayName("Oral unscored does not leak into the written score")
    void oralNotIncludedInWritten() {
        ProfileSnapshot profile = telcSnapshot(false);
        var inputs = new HashMap<>(fullObjective(profile));
        inputs.put("SCHRIFTLICHER_AUSDRUCK", assessed("45"));
        inputs.put("MUENDLICH_2", assessed("30")); // even a stray assessment is ignored while oral scoring is off
        ExamResult r = calculator.calculate(profile, inputs);
        assertEquals(0, bd("225").compareTo(r.writtenScore()));
        assertEquals(ExamResultStatus.NOT_ASSESSED, r.oralResult());
    }

    @Test
    @DisplayName("Oral pass boundary when scoring is enabled: 45/75 passes, 44.5 does not")
    void oralBoundary() {
        ProfileSnapshot profile = telcSnapshot(true);
        var base = new HashMap<>(fullObjective(profile));
        base.put("SCHRIFTLICHER_AUSDRUCK", assessed("45"));

        var pass = new HashMap<>(base);
        pass.put("MUENDLICH_1", assessed("10"));
        pass.put("MUENDLICH_2", assessed("17.5"));
        pass.put("MUENDLICH_3", assessed("17.5"));
        ExamResult passed = calculator.calculate(profile, pass);
        assertEquals(0, bd("45").compareTo(passed.oralScore()));
        assertEquals(ExamResultStatus.PASSED, passed.oralResult());
        assertEquals(ExamResultStatus.PASSED, passed.overallResult());
        assertEquals(0, bd("270").compareTo(passed.totalScore()));

        var fail = new HashMap<>(base);
        fail.put("MUENDLICH_1", assessed("10"));
        fail.put("MUENDLICH_2", assessed("17"));
        fail.put("MUENDLICH_3", assessed("17.5"));
        ExamResult failed = calculator.calculate(profile, fail);
        assertEquals(0, bd("44.5").compareTo(failed.oralScore()));
        assertEquals(ExamResultStatus.NOT_PASSED, failed.oralResult());
        assertEquals(ExamResultStatus.NOT_PASSED, failed.overallResult());
        assertEquals(ExamResultCalculator.EXPLAIN_ORAL_FAILED, failed.overallExplanation());
    }

    @Test
    @DisplayName("Oral scoring enabled but unassessed -> awaiting assessment")
    void oralAwaiting() {
        ProfileSnapshot profile = telcSnapshot(true);
        var inputs = new HashMap<>(fullObjective(profile));
        inputs.put("SCHRIFTLICHER_AUSDRUCK", assessed("45"));
        ExamResult r = calculator.calculate(profile, inputs);
        assertEquals(ExamResultStatus.AWAITING_ASSESSMENT, r.oralResult());
        assertEquals(ExamResultStatus.AWAITING_ASSESSMENT, r.overallResult());
    }

    @Test
    @DisplayName("WRITTEN_ONLY policy lets the written result decide the overall result")
    void writtenOnlyPolicy() {
        ProfileSnapshot base = telcSnapshot(false);
        ProfileSnapshot writtenOnly = new ProfileSnapshot(base.profileId(), base.code(), base.version(), base.provider(), base.examName(), base.title(),
                base.examType(), base.level(), false, base.writtenMaxPoints(), base.writtenPassThreshold(), base.oralMaxPoints(), base.oralPassThreshold(),
                OverallResultPolicy.WRITTEN_ONLY, base.answerReleasePolicy(), null, base.config());
        var inputs = new HashMap<>(fullObjective(writtenOnly));
        inputs.put("SCHRIFTLICHER_AUSDRUCK", assessed("45"));
        assertEquals(ExamResultStatus.PASSED, calculator.calculate(writtenOnly, inputs).overallResult());
    }
}
