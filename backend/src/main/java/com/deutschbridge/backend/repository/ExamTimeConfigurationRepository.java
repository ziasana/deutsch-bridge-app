package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ExamTimeConfiguration;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamTimeConfigurationRepository extends JpaRepository<ExamTimeConfiguration, String> {

    List<ExamTimeConfiguration> findByExamTypeAndLevel(ExamType examType, LearningLevel level);

    Optional<ExamTimeConfiguration> findByExamTypeAndLevelAndSectionAndTeil(
            ExamType examType, LearningLevel level, ExamSection section, int teil);

    void deleteByExamTypeAndLevel(ExamType examType, LearningLevel level);
}
