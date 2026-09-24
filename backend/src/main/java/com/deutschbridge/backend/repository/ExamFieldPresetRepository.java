package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ExamFieldPreset;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.LearningLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamFieldPresetRepository extends JpaRepository<ExamFieldPreset, String> {

    /** All three field types for one section+level in one query - the frontend splits them by fieldType. */
    List<ExamFieldPreset> findBySectionAndLevelOrderByFieldTypeAscLabelAsc(ExamSection section, LearningLevel level);
}
