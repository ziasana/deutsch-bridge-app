package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.GrammarCategory;
import com.deutschbridge.backend.model.entity.GrammarLesson;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.GrammarLessonStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface GrammarLessonRepository extends JpaRepository<GrammarLesson, String> {

    @Query("SELECT DISTINCT g FROM grammarLessons g")
    List<GrammarLesson> getWithLearningProgress();

    boolean existsByTitleIgnoreCase(String title);

    /** A lesson is a duplicate only when title, level and category all match. */
    boolean existsByTitleIgnoreCaseAndLevelAndCategory_Id(String title, LearningLevel level, String categoryId);

    boolean existsByTitleIgnoreCaseAndLevelAndCategoryIsNull(String title, LearningLevel level);

    List<GrammarLesson> findByCategory(GrammarCategory category);

    long countByStatusAndCreatedAtAfter(GrammarLessonStatus status, LocalDateTime after);

    @Modifying
    @Query("UPDATE grammarLessons g SET g.category = null WHERE g.category = :category")
    void unassignCategory(GrammarCategory category);
}
