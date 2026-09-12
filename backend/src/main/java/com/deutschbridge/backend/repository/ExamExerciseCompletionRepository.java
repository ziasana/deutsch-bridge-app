package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ExamExerciseCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamExerciseCompletionRepository extends JpaRepository<ExamExerciseCompletion, String> {

    List<ExamExerciseCompletion> findByUserId(String userId);

    Optional<ExamExerciseCompletion> findByUserIdAndExerciseId(String userId, String exerciseId);
}
