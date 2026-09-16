package com.deutschbridge.backend.util;

import com.deutschbridge.backend.model.dto.ExamExercisePublicResponse;
import com.deutschbridge.backend.model.dto.ExamExerciseResponse;
import com.deutschbridge.backend.model.dto.ExamPassagePublic;
import com.deutschbridge.backend.model.dto.ExamQuestionPublic;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.ExamPassage;
import com.deutschbridge.backend.model.entity.ExamQuestion;

import java.util.Comparator;
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
                exercise.getTeilDescription(),
                exercise.getModelSolution(),
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
                passages.stream().map(p -> new ExamPassagePublic(p.getId(), p.getLabel(), p.getContent(), p.getImageUrl(), p.getAudioUrl())).toList(),
                mapQuestionsToPublic(questions),
                exercise.getAnswerOptions(),
                exercise.getTeilDescription(),
                exercise.getModelSolution(),
                exercise.getDefaultExplanation(),
                exercise.getDefaultCommonMistake(),
                completedExerciseIds.contains(exercise.getId())
        );
    }

    /**
     * Answer-key-stripped question list, sorted ascending by the admin-assigned questionNumber
     * (questions without one sort after those with one, keeping their original relative order) -
     * shared by the exercise-fetch and start-attempt endpoints so students always see the same order.
     */
    public static List<ExamQuestionPublic> mapQuestionsToPublic(List<ExamQuestion> questions) {
        if (questions == null) return List.of();
        return questions.stream()
                .sorted(Comparator.comparing(ExamQuestion::getQuestionNumber, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(q -> new ExamQuestionPublic(q.getId(), q.getTaskType(), q.getPrompt(), q.getSectionIndex(), q.getOptions(), q.getGapNumber(), q.getQuestionNumber()))
                .toList();
    }
}
