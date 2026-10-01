package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.WritingGuideItem;
import com.deutschbridge.backend.model.enums.LearningLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WritingGuideItemRepository extends JpaRepository<WritingGuideItem, String> {

    List<WritingGuideItem> findByLevelAndActiveTrueOrderByKindAscSortOrderAsc(LearningLevel level);

    boolean existsByLevel(LearningLevel level);
}
