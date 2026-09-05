package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.DailyWord;
import com.deutschbridge.backend.model.entity.GrammarLesson;
import com.deutschbridge.backend.model.entity.LearningProgress;
import com.deutschbridge.backend.model.entity.NomenVerbConnection;
import com.deutschbridge.backend.model.entity.ReadingArticle;
import com.deutschbridge.backend.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;


@Repository
public interface LearningProgressRepository extends JpaRepository<LearningProgress,String> {

    Optional<LearningProgress> findByUserAndLesson(User user, GrammarLesson lesson);

    Optional<LearningProgress> findByUserAndNomenVerb(User user, NomenVerbConnection nomenVerb);

    Optional<LearningProgress> findByUserAndDailyWord(User user, DailyWord dailyWord);

    Optional<LearningProgress> findByUserAndReading(User user, ReadingArticle reading);

    List<LearningProgress> findByUserAndDailyWordIn(User user, List<DailyWord> dailyWords);

    List<LearningProgress> findByUserAndNomenVerbIn(User user, List<NomenVerbConnection> nomenVerbs);

    List<LearningProgress> findByUserAndLessonIn(User user, List<GrammarLesson> lessons);

    List<LearningProgress> findByUserAndReadingIn(User user, List<ReadingArticle> readings);

    long countByUserAndIsLearnedTrue(User user);

    long countByUserAndLessonIsNotNullAndIsLearnedTrue(User user);

    long countByUserAndNomenVerbIsNotNullAndIsLearnedTrue(User user);

    long countByUserAndDailyWordIsNotNullAndIsLearnedTrue(User user);

    long countByUserAndReadingIsNotNullAndIsLearnedTrue(User user);

    long countByUserAndIsLearnedTrueAndLearnedAtBetween(User user, LocalDateTime start, LocalDateTime end);

    @Query("SELECT DISTINCT CAST(lp.learnedAt AS localdate) FROM learning_progress lp " +
            "WHERE lp.user = :user AND lp.isLearned = true ORDER BY 1 DESC")
    List<LocalDate> findDistinctLearnedDatesByUser(@Param("user") User user);
}
