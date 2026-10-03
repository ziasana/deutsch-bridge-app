package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.GrammarLesson;
import com.deutschbridge.backend.model.entity.GrammarLessonBookmark;
import com.deutschbridge.backend.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
