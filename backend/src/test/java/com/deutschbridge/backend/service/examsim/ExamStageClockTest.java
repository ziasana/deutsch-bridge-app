package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.model.examsim.ExamTimerConfig;
import com.deutschbridge.backend.model.examsim.StageState;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ExamStageClockTest {

    private static final long MIN = 60_000L;
    private final List<ExamTimerConfig> timers = TelcB1ProfileFactory.request().config().timers(); // 90, 30, 30, prep 20, 15

    @Test
    @DisplayName("Shared timer: the first stage covers all Lesen/Sprachbausteine parts for 90 minutes")
    void firstStageIsSharedNinetyMinutes() {
        List<StageState> stages = ExamStageClock.start(timers, 0);
        assertEquals(1, stages.size());
        assertEquals("LESEN_SPRACHBAUSTEINE", stages.get(0).timerKey());
        assertEquals(90 * MIN, stages.get(0).deadlineAtMs());
        assertEquals(185 * MIN, ExamStageClock.finalDeadlineMs(timers, stages));
    }

    @Test
    @DisplayName("Nothing expires before the deadline")
    void notExpiredBeforeDeadline() {
        List<StageState> stages = ExamStageClock.start(timers, 0);
        assertEquals(stages, ExamStageClock.advance(timers, stages, 90 * MIN - 1));
    }

    @Test
    @DisplayName("An expired stage hands over to the next one at its deadline")
    void expirationChainsStages() {
        List<StageState> stages = ExamStageClock.advance(timers, ExamStageClock.start(timers, 0), 95 * MIN);
        assertEquals(2, stages.size());
        assertEquals(StageState.EXPIRED, stages.get(0).endReason());
        assertEquals(90 * MIN, stages.get(0).endedAtMs());
        assertEquals("HOEREN", stages.get(1).timerKey());
        assertEquals(90 * MIN, stages.get(1).startedAtMs());
        assertEquals(120 * MIN, stages.get(1).deadlineAtMs());
    }

    @Test
    @DisplayName("Several stages can expire at once after a long absence")
    void longAbsenceExpiresSeveralStages() {
        List<StageState> stages = ExamStageClock.advance(timers, ExamStageClock.start(timers, 0), 160 * MIN);
        assertEquals(List.of("LESEN_SPRACHBAUSTEINE", "HOEREN", "SCHREIBEN", "MUENDLICH_VORBEREITUNG"),
                stages.stream().map(StageState::timerKey).toList().subList(0, 4));
        assertEquals("MUENDLICH_VORBEREITUNG", ExamStageClock.current(stages).timerKey());
        assertTrue(ExamStageClock.current(stages).isRunning());
    }

    @Test
    @DisplayName("Completing a stage early starts the next stage immediately")
    void completeStartsNextNow() {
        List<StageState> stages = ExamStageClock.completeCurrent(timers, ExamStageClock.start(timers, 0), 40 * MIN);
        assertEquals(StageState.COMPLETED, stages.get(0).endReason());
        assertEquals(40 * MIN, stages.get(1).startedAtMs());
        assertEquals(70 * MIN, stages.get(1).deadlineAtMs());
        assertEquals(40 * MIN + 30 * MIN + 30 * MIN + 20 * MIN + 15 * MIN, ExamStageClock.finalDeadlineMs(timers, stages));
    }

    @Test
    @DisplayName("Last stage: exam stays open for the grace period, then it is over")
    void examOverAfterGrace() {
        List<StageState> stages = ExamStageClock.start(timers, 0);
        stages = ExamStageClock.advance(timers, stages, 400 * MIN);
        assertTrue(ExamStageClock.allStagesEnded(timers, stages));
        long end = ExamStageClock.current(stages).endedAtMs();
        assertEquals(185 * MIN, end);
        assertFalse(ExamStageClock.examOver(timers, stages, end + 4_000, 5_000));
        assertTrue(ExamStageClock.examOver(timers, stages, end + 5_000, 5_000));
    }

    @Test
    @DisplayName("Completing the last stage ends the exam at once")
    void completingLastStageEndsExam() {
        List<StageState> stages = ExamStageClock.start(timers, 0);
        for (int i = 0; i < timers.size(); i++) stages = ExamStageClock.completeCurrent(timers, stages, (i + 1) * MIN);
        assertTrue(ExamStageClock.examOver(timers, stages, 10 * MIN, 5_000));
        assertEquals(5, stages.size());
    }
}
