package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamExerciseRepository extends JpaRepository<ExamExercise, String> {

    List<ExamExercise> findBySection(ExamSection section);

    List<ExamExercise> findBySectionAndLevel(ExamSection section, LearningLevel level);

    List<ExamExercise> findBySectionAndTaskType(ExamSection section, ExamTaskType taskType);

    List<ExamExercise> findBySectionAndLevelAndTaskType(ExamSection section, LearningLevel level, ExamTaskType taskType);
}
