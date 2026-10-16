package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.SpeakingGuide;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpeakingGuideRepository extends JpaRepository<SpeakingGuide, String> {

    List<SpeakingGuide> findByExamTypeAndLevelOrderByPartNumberAsc(ExamType examType, LearningLevel level);

    Optional<SpeakingGuide> findByExamTypeAndLevelAndPartNumber(ExamType examType, LearningLevel level, int partNumber);
}
