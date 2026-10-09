package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.SpeakingLearnProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpeakingLearnProgressRepository extends JpaRepository<SpeakingLearnProgress, String> {

    List<SpeakingLearnProgress> findByUserIdAndLevel(String userId, String level);

    Optional<SpeakingLearnProgress> findByUserIdAndLevelAndPartNumberAndStation(String userId, String level, int partNumber, String station);

    @Transactional
    void deleteByUserIdAndLevelAndPartNumber(String userId, String level, int partNumber);
}
