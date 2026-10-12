package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ExamSimulationAudioPlay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamSimulationAudioPlayRepository extends JpaRepository<ExamSimulationAudioPlay, String> {

    List<ExamSimulationAudioPlay> findByAttemptId(String attemptId);

    Optional<ExamSimulationAudioPlay> findByAttemptIdAndPartKeyAndPassageId(String attemptId, String partKey, String passageId);
}
