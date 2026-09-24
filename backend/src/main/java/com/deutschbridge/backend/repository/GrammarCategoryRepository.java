package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.GrammarCategory;
import com.deutschbridge.backend.model.enums.LearningLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GrammarCategoryRepository extends JpaRepository<GrammarCategory, String> {

    List<GrammarCategory> findAllByOrderByLevelAscSortOrderAsc();

    List<GrammarCategory> findByLevelOrderBySortOrderAscTitleAsc(LearningLevel level);

    boolean existsByTitleIgnoreCaseAndLevel(String title, LearningLevel level);
}
