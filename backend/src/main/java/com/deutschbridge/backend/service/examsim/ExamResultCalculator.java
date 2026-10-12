package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.model.enums.ExamPartModule;
import com.deutschbridge.backend.model.enums.ExamResultStatus;
import com.deutschbridge.backend.model.enums.OverallResultPolicy;
import com.deutschbridge.backend.model.enums.PartResultStatus;
import com.deutschbridge.backend.model.examsim.ExamPartConfig;
import com.deutschbridge.backend.model.examsim.ExamResult;
import com.deutschbridge.backend.model.examsim.ExerciseSnapshot;
import com.deutschbridge.backend.model.examsim.PartResult;
import com.deutschbridge.backend.model.examsim.ProfileSnapshot;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Turns an attempt's stored answers, assessments and frozen profile into an {@link ExamResult}. The written, oral and
 * overall results are derived separately; thresholds, maximums and the overall policy all come from the snapshot.
 */
@Component
public class ExamResultCalculator {

    public static final String EXPLAIN_PASSED = "ALL_PASSED";
    public static final String EXPLAIN_WRITTEN_PENDING = "WRITTEN_ASSESSMENT_PENDING";
    public static final String EXPLAIN_WRITTEN_FAILED = "WRITTEN_NOT_PASSED";
    public static final String EXPLAIN_ORAL_NOT_ASSESSED = "ORAL_NOT_ASSESSED";
    public static final String EXPLAIN_ORAL_PENDING = "ORAL_ASSESSMENT_PENDING";
    public static final String EXPLAIN_ORAL_FAILED = "ORAL_NOT_PASSED";
    public static final String EXPLAIN_WRITTEN_ONLY = "WRITTEN_RESULT_ONLY";

    private final ExamScoringService scoringService;
    private final Clock clock;

    public ExamResultCalculator(ExamScoringService scoringService, Clock clock) {
        this.scoringService = scoringService;
        this.clock = clock;
    }

    /** Everything the calculator needs about one part of the attempt. */
    public record PartInput(List<ExerciseSnapshot> exercises, Map<String, String> answers, boolean completed, PartScoringContext.Assessment assessment) {
    }

    public ExamResult calculate(ProfileSnapshot profile, Map<String, PartInput> inputsByPartKey) {
        List<PartResult> parts = new ArrayList<>();
        for (ExamPartConfig part : profile.config().partsOrEmpty()) {
            PartInput in = inputsByPartKey.getOrDefault(part.key(), new PartInput(List.of(), Map.of(), false, null));
            parts.add(scoringService.scorePart(new PartScoringContext(profile.config(), part, ExamScoringService.effectiveMethod(profile, part),
                    in.exercises(), in.answers(), in.completed(), in.assessment())));
        }
        int scale = profile.config().scale();
        RoundingMode mode = profile.config().rounding();

        List<PartResult> written = parts.stream().filter(p -> p.module() == ExamPartModule.WRITTEN).toList();
        List<PartResult> oral = parts.stream().filter(p -> p.module() == ExamPartModule.ORAL).toList();

        BigDecimal writtenScore = sumScored(written, scale, mode);
        boolean writtenComplete = written.stream().noneMatch(p -> p.status() == PartResultStatus.AWAITING_ASSESSMENT);
        ExamResultStatus writtenResult = !writtenComplete ? ExamResultStatus.AWAITING_ASSESSMENT
                : writtenScore.compareTo(profile.writtenPassThreshold()) >= 0 ? ExamResultStatus.PASSED : ExamResultStatus.NOT_PASSED;
        BigDecimal writtenPct = profile.writtenMaxPoints().signum() == 0 ? BigDecimal.ZERO
                : writtenScore.multiply(BigDecimal.valueOf(100)).divide(profile.writtenMaxPoints(), 1, RoundingMode.HALF_UP);

        boolean oralScored = profile.oralScoringEnabled();
        BigDecimal oralScore = null;
        ExamResultStatus oralResult;
        if (!oralScored) {
            oralResult = ExamResultStatus.NOT_ASSESSED;
        } else if (oral.stream().anyMatch(p -> p.status() == PartResultStatus.AWAITING_ASSESSMENT)) {
            oralResult = ExamResultStatus.AWAITING_ASSESSMENT;
        } else {
            oralScore = sumScored(oral, scale, mode);
            oralResult = oralScore.compareTo(profile.oralPassThreshold()) >= 0 ? ExamResultStatus.PASSED : ExamResultStatus.NOT_PASSED;
        }

        String[] overall = overall(profile.overallResultPolicy(), writtenResult, oralResult);
        BigDecimal total = writtenComplete && (oralScore != null) ? writtenScore.add(oralScore) : null;
        List<String> pending = parts.stream().filter(p -> p.status() == PartResultStatus.AWAITING_ASSESSMENT).map(PartResult::key).toList();

        return new ExamResult(writtenScore, profile.writtenMaxPoints(), writtenPct, writtenComplete, profile.writtenPassThreshold(), writtenResult,
                oralScored, oralScore, profile.oralMaxPoints(), profile.oralPassThreshold(), oralResult,
                total, profile.totalMaxPoints(), ExamResultStatus.valueOf(overall[0]), overall[1], parts, pending, clock.millis());
    }

    /** @return {overall status name, explanation code} */
    static String[] overall(OverallResultPolicy policy, ExamResultStatus written, ExamResultStatus oral) {
        if (policy == OverallResultPolicy.WRITTEN_ONLY) {
            return new String[]{written.name(), written == ExamResultStatus.AWAITING_ASSESSMENT ? EXPLAIN_WRITTEN_PENDING : EXPLAIN_WRITTEN_ONLY};
        }
        if (written == ExamResultStatus.AWAITING_ASSESSMENT) return new String[]{ExamResultStatus.AWAITING_ASSESSMENT.name(), EXPLAIN_WRITTEN_PENDING};
        if (written == ExamResultStatus.NOT_PASSED) return new String[]{ExamResultStatus.NOT_PASSED.name(), EXPLAIN_WRITTEN_FAILED};
        return switch (oral) {
            case PASSED -> new String[]{ExamResultStatus.PASSED.name(), EXPLAIN_PASSED};
            case NOT_PASSED -> new String[]{ExamResultStatus.NOT_PASSED.name(), EXPLAIN_ORAL_FAILED};
            case AWAITING_ASSESSMENT -> new String[]{ExamResultStatus.AWAITING_ASSESSMENT.name(), EXPLAIN_ORAL_PENDING};
            default -> new String[]{ExamResultStatus.INCOMPLETE.name(), EXPLAIN_ORAL_NOT_ASSESSED};
        };
    }

    private BigDecimal sumScored(List<PartResult> parts, int scale, RoundingMode mode) {
        return parts.stream().filter(p -> p.status() == PartResultStatus.SCORED && p.score() != null)
                .map(PartResult::score).reduce(BigDecimal.ZERO, BigDecimal::add).setScale(scale, mode);
    }
}
