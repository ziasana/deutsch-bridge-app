package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ExamSimulationAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamSimulationAnswerRepository extends JpaRepository<ExamSimulationAnswer, String> {

    List<ExamSimulationAnswer> findByAttemptId(String attemptId);

    Optional<ExamSimulationAnswer> findByAttemptIdAndPartKeyAndQuestionId(String attemptId, String partKey, String questionId);
}
