package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.WritingLearnProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface WritingLearnProgressRepository extends JpaRepository<WritingLearnProgress, String> {

    List<WritingLearnProgress> findByUserIdAndLevel(String userId, String level);

    Optional<WritingLearnProgress> findByUserIdAndLevelAndStation(String userId, String level, String station);

    @Transactional
    void deleteByUserIdAndLevel(String userId, String level);
}
