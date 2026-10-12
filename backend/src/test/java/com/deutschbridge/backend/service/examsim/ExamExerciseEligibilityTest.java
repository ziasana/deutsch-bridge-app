package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.enums.ExamContentStatus;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.examsim.ExamPartConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static com.deutschbridge.backend.service.examsim.ExamSimulationFixtures.publishedExercise;
import static com.deutschbridge.backend.service.examsim.ExamSimulationFixtures.telcProfile;
import static org.junit.jupiter.api.Assertions.*;

class ExamExerciseEligibilityTest {

    private final ExamPartConfig lesen3 = telcProfile().getConfig().part("LESEN_3");
    private final ExamPartConfig hoeren1 = telcProfile().getConfig().part("HOEREN_1");
    private final ExamPartConfig sprach2 = telcProfile().getConfig().part("SPRACHBAUSTEINE_2");

    private boolean eligible(ExamExercise e, ExamPartConfig part) {
        return ExamExerciseEligibility.isEligible(e, ExamType.TELC, LearningLevel.B1, part);
    }

    @Test
    @DisplayName("A published exercise with the right section, Teil, level and question count is eligible")
    void eligible() {
        assertTrue(eligible(publishedExercise("a", ExamSection.LESEVERSTEHEN, 3, 10), lesen3));
    }

    @Test
    @DisplayName("Unpublished, draft, wrong Teil, wrong level, wrong exam type or wrong question count are not eligible")
    void notEligible() {
        ExamExercise draft = publishedExercise("a", ExamSection.LESEVERSTEHEN, 3, 10);
        draft.applyStatus(ExamContentStatus.DRAFT);
        assertFalse(eligible(draft, lesen3));
        assertFalse(eligible(publishedExercise("b", ExamSection.LESEVERSTEHEN, 2, 10), lesen3));
        assertFalse(eligible(publishedExercise("c", ExamSection.LESEVERSTEHEN, 3, 9), lesen3));
        ExamExercise level = publishedExercise("d", ExamSection.LESEVERSTEHEN, 3, 10);
        level.setLevel(LearningLevel.B2);
        assertFalse(eligible(level, lesen3));
        ExamExercise other = publishedExercise("e", ExamSection.LESEVERSTEHEN, 3, 10);
        other.setExamType(ExamType.GOETHE);
        assertFalse(eligible(other, lesen3));
    }

    @Test
    @DisplayName("Questions without a stored answer key make an exercise ineligible")
    void needsAnswerKey() {
        ExamExercise e = publishedExercise("a", ExamSection.LESEVERSTEHEN, 3, 10);
        e.getQuestions().get(4).setCorrectAnswer(" ");
        assertFalse(eligible(e, lesen3));
    }

    @Test
    @DisplayName("Listening exercises need audio")
    void listeningNeedsAudio() {
        ExamExercise e = publishedExercise("a", ExamSection.HOERVERSTEHEN, 1, 5);
        assertTrue(eligible(e, hoeren1));
        e.getPassages().get(0).setAudioUrl(null);
        assertFalse(eligible(e, hoeren1));
    }

    @Test
    @DisplayName("Sprachbausteine Teil 2 is resolved from the task type like in the practice area")
    void sprachbausteineTeilFromTaskType() {
        ExamExercise e = publishedExercise("a", ExamSection.SPRACHBAUSTEINE, 0, 10);
        e.setTaskType(ExamTaskType.WORD_BANK_CLOZE);
        assertTrue(eligible(e, sprach2));
        e.setTaskType(ExamTaskType.MULTIPLE_CHOICE);
        assertFalse(eligible(e, sprach2));
    }

    @Test
    @DisplayName("Task type restrictions of a part are honoured")
    void taskTypeRestriction() {
        ExamPartConfig restricted = new ExamPartConfig(lesen3.key(), lesen3.label(), lesen3.module(), lesen3.section(), lesen3.teil(),
                List.of(ExamTaskType.SITUATION_MATCHING), 1, 10, lesen3.pointsPerQuestion(), lesen3.maxPoints(), lesen3.scoringMethod(), lesen3.timerKey(), null);
        ExamExercise e = publishedExercise("a", ExamSection.LESEVERSTEHEN, 3, 10);
        assertFalse(eligible(e, restricted));
        e.setTaskType(ExamTaskType.SITUATION_MATCHING);
        assertTrue(eligible(e, restricted));
    }
}
