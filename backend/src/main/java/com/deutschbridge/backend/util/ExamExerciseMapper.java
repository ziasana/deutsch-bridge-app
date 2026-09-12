package com.deutschbridge.backend.util;

import com.deutschbridge.backend.model.dto.ExamExercisePublicResponse;
import com.deutschbridge.backend.model.dto.ExamExerciseResponse;
import com.deutschbridge.backend.model.dto.ExamPassagePublic;
import com.deutschbridge.backend.model.dto.ExamQuestionPublic;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.ExamPassage;
import com.deutschbridge.backend.model.entity.ExamQuestion;

import java.util.List;
import java.util.Set;

public class ExamExerciseMapper {
    private ExamExerciseMapper() {
        throw new IllegalStateException("Mapper Utils class");
    }

    public static ExamExerciseResponse mapToResponse(ExamExercise exercise) {
        return new ExamExerciseResponse(
                exercise.getId(),
                exercise.getTitle(),
                exercise.getSection() != null ? exercise.getSection().name() : null,
                exercise.getTaskType() != null ? exercise.getTaskType().name() : null,
                exercise.getLevel() != null ? exercise.getLevel().getValue() : null,
                exercise.getPartNumber(),
                exercise.getPassages(),
                exercise.getQuestions(),
                exercise.getAnswerOptions(),
                exercise.getDefaultExplanation(),
                exercise.getDefaultCommonMistake(),
                exercise.isPublished(),
                exercise.getCreatedAt()
        );
    }

    /**
     * Answer-key-stripped shape for students - unlike Reading, exam content itself (not just the
     * start-attempt flow) is fetched directly, so passages/questions must never leak answers here.
     */
    public static ExamExercisePublicResponse mapToPublicResponse(ExamExercise exercise) {
        return mapToPublicResponse(exercise, Set.of());
    }

    public static ExamExercisePublicResponse mapToPublicResponse(ExamExercise exercise, Set<String> completedExerciseIds) {
        List<ExamPassage> passages = exercise.getPassages() != null ? exercise.getPassages() : List.of();
        List<ExamQuestion> questions = exercise.getQuestions() != null ? exercise.getQuestions() : List.of();

        return new ExamExercisePublicResponse(
                exercise.getId(),
                exercise.getTitle(),
                exercise.getSection() != null ? exercise.getSection().name() : null,
                exercise.getTaskType() != null ? exercise.getTaskType().name() : null,
                exercise.getLevel() != null ? exercise.getLevel().getValue() : null,
                exercise.getPartNumber(),
                passages.stream().map(p -> new ExamPassagePublic(p.getId(), p.getLabel(), p.getContent(), p.getImageUrl())).toList(),
                questions.stream()
                        .map(q -> new ExamQuestionPublic(q.getId(), q.getTaskType(), q.getPrompt(), q.getSectionIndex(), q.getOptions(), q.getGapNumber()))
                        .toList(),
                exercise.getAnswerOptions(),
                completedExerciseIds.contains(exercise.getId())
        );
    }
}
