package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.GrammarCategory;
import com.deutschbridge.backend.model.entity.GrammarLesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GrammarLessonRepository extends JpaRepository<GrammarLesson, String> {

    @Query("SELECT DISTINCT g FROM grammarLessons g")
    List<GrammarLesson> getWithLearningProgress();

    boolean existsByTitleIgnoreCase(String title);

    List<GrammarLesson> findByCategory(GrammarCategory category);

    @Modifying
    @Query("UPDATE grammarLessons g SET g.category = null WHERE g.category = :category")
    void unassignCategory(GrammarCategory category);
}
