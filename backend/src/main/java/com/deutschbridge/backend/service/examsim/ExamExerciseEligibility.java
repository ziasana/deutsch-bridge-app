package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.ExamPassage;
import com.deutschbridge.backend.model.entity.ExamQuestion;
import com.deutschbridge.backend.model.enums.ExamContentStatus;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.PartScoringMethod;
import com.deutschbridge.backend.model.examsim.ExamPartConfig;
import com.deutschbridge.backend.util.ExamTeilResolver;

import java.util.List;
import java.util.Objects;

/** The selection rules deciding whether a published exercise may be drawn for a part. Pure and profile-agnostic. */
public final class ExamExerciseEligibility {

    private ExamExerciseEligibility() {
    }

    public static boolean isEligible(ExamExercise e, ExamType examType, LearningLevel level, ExamPartConfig part) {
        return rejection(e, examType, level, part) == null;
    }

    /** Why an exercise cannot be used for a part (a stable code), or null when it is eligible. */
    public static String rejection(ExamExercise e, ExamType examType, LearningLevel level, ExamPartConfig part) {
        if (e.getStatus() != ExamContentStatus.PUBLISHED || !e.isPublished()) return "NOT_PUBLISHED";
        if (e.getExamType() != examType) return "OTHER_EXAM_TYPE";
        if (e.getLevel() != level) return "OTHER_LEVEL";
        if (e.getSection() != part.section()) return "OTHER_SECTION";
        if (!Objects.equals(ExamTeilResolver.teilOf(e), part.teil())) return "OTHER_TEIL";
        if (part.taskTypes() != null && !part.taskTypes().isEmpty() && !part.taskTypes().contains(e.getTaskType())) return "TASK_TYPE";

        List<ExamQuestion> questions = e.getQuestions() != null ? e.getQuestions() : List.of();
        List<ExamPassage> passages = e.getPassages() != null ? e.getPassages() : List.of();

        if (part.scoringMethod() == PartScoringMethod.PER_QUESTION) {
            if (part.questionCount() == null || questions.size() != part.questionCount() / part.effectiveExerciseCount()) return "QUESTION_COUNT";
            if (questions.stream().anyMatch(q -> q.getId() == null || q.getCorrectAnswer() == null || q.getCorrectAnswer().isBlank())) return "MISSING_ANSWER_KEY";
        }
        if (part.section() == ExamSection.HOERVERSTEHEN && passages.stream().noneMatch(p -> p.getAudioUrl() != null && !p.getAudioUrl().isBlank())) {
            return "NO_AUDIO";
        }
        if (part.section() == ExamSection.SCHRIFTLICHER_AUSDRUCK || part.section() == ExamSection.MUENDLICHER_AUSDRUCK) {
            boolean hasSpeaking = e.getMetadata() != null && e.getMetadata().get("speaking") != null;
            if (passages.isEmpty() && !hasSpeaking) return "NO_CONTENT";
        }
        return null;
    }
}
