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
        if (e.getStatus() != ExamContentStatus.PUBLISHED || !e.isPublished()) return false;
        if (e.getExamType() != examType || e.getLevel() != level || e.getSection() != part.section()) return false;
        if (!Objects.equals(ExamTeilResolver.teilOf(e), part.teil())) return false;
        if (part.taskTypes() != null && !part.taskTypes().isEmpty() && !part.taskTypes().contains(e.getTaskType())) return false;

        List<ExamQuestion> questions = e.getQuestions() != null ? e.getQuestions() : List.of();
        List<ExamPassage> passages = e.getPassages() != null ? e.getPassages() : List.of();

        if (part.scoringMethod() == PartScoringMethod.PER_QUESTION) {
            if (part.questionCount() == null || questions.size() != part.questionCount() / part.effectiveExerciseCount()) return false;
            if (questions.stream().anyMatch(q -> q.getId() == null || q.getCorrectAnswer() == null || q.getCorrectAnswer().isBlank())) return false;
        }
        if (part.section() == ExamSection.HOERVERSTEHEN && passages.stream().noneMatch(p -> p.getAudioUrl() != null && !p.getAudioUrl().isBlank())) {
            return false;
        }
        if (part.section() == ExamSection.SCHRIFTLICHER_AUSDRUCK || part.section() == ExamSection.MUENDLICHER_AUSDRUCK) {
            boolean hasSpeaking = e.getMetadata() != null && e.getMetadata().get("speaking") != null;
            return !passages.isEmpty() || hasSpeaking;
        }
        return true;
    }
}
