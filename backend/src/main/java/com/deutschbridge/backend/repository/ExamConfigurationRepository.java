package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ExamConfiguration;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExamConfigurationRepository extends JpaRepository<ExamConfiguration, String> {

    Optional<ExamConfiguration> findByExamTypeAndLevel(ExamType examType, LearningLevel level);
}
