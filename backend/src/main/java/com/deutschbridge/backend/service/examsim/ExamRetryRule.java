package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.model.enums.ExamResultStatus;
import com.deutschbridge.backend.model.enums.SimulationAttemptStatus;
import com.deutschbridge.backend.model.examsim.ExamResult;

/**
 * When a learner may take the same mock exam again: only after a finished attempt that was not passed. A passed exam, one still waiting
 * for a manual assessment, a cancelled one or a running one cannot be repeated.
 */
public final class ExamRetryRule {

    private ExamRetryRule() {
    }

    public static boolean canRepeat(SimulationAttemptStatus status, ExamResult result) {
        if (status != SimulationAttemptStatus.COMPLETED && status != SimulationAttemptStatus.EXPIRED) return false;
        if (result == null) return false;
        return result.overallResult() == ExamResultStatus.NOT_PASSED || result.writtenResult() == ExamResultStatus.NOT_PASSED;
    }
}
