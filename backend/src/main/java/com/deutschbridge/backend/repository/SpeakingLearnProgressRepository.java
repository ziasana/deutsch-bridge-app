package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.SpeakingLearnProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpeakingLearnProgressRepository extends JpaRepository<SpeakingLearnProgress, String> {

    List<SpeakingLearnProgress> findByUserIdAndExamTypeAndLevel(String userId, String examType, String level);

    Optional<SpeakingLearnProgress> findByUserIdAndExamTypeAndLevelAndPartNumberAndStation(String userId, String examType, String level, int partNumber, String station);

    @Transactional
    void deleteByUserIdAndExamTypeAndLevelAndPartNumber(String userId, String examType, String level, int partNumber);
}
