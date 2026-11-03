package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.GrammarLesson;
import com.deutschbridge.backend.model.entity.GrammarLessonBookmark;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.GrammarLessonStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;

@Repository
public interface GrammarLessonBookmarkRepository extends JpaRepository<GrammarLessonBookmark, String> {

    boolean existsByUserAndLesson(User user, GrammarLesson lesson);

    @Transactional
    void deleteByUserAndLesson(User user, GrammarLesson lesson);

    @Transactional
    void deleteByLesson(GrammarLesson lesson);

    /** For merging bookmark state onto light list rows / full lessons. */
    List<GrammarLessonBookmark> findByUserAndLesson_IdIn(User user, Collection<String> lessonIds);

    /**
     * The user's bookmarks on published lessons they haven't learned yet, oldest bookmark first -
     * the "saved for later" to-do list, across every level.
     */
    @Query("SELECT b FROM grammar_lesson_bookmarks b JOIN FETCH b.lesson l " +
            "WHERE b.user = :user AND l.status = :status AND NOT EXISTS (" +
            "SELECT 1 FROM learning_progress p WHERE p.user = :user AND p.lesson = l AND p.isLearned = true) " +
            "ORDER BY b.createdAt ASC")
    List<GrammarLessonBookmark> findPending(@Param("user") User user, @Param("status") GrammarLessonStatus status);

    /**
     * Same list as {@link #findPending}, but only the lesson id and the bookmark time - never the lesson texts and quizzes
     * (the "saved for later" card reads its titles from the cached lessons).
     */
    @Query("SELECT l.id AS lessonId, b.createdAt AS createdAt FROM grammar_lesson_bookmarks b JOIN b.lesson l " +
            "WHERE b.user = :user AND l.status = :status AND NOT EXISTS (" +
            "SELECT 1 FROM learning_progress p WHERE p.user = :user AND p.lesson = l AND p.isLearned = true) " +
            "ORDER BY b.createdAt ASC")
    List<PendingBookmarkRow> findPendingRows(@Param("user") User user, @Param("status") GrammarLessonStatus status);

    interface PendingBookmarkRow {
        String getLessonId();
        java.time.LocalDateTime getCreatedAt();
    }
}
