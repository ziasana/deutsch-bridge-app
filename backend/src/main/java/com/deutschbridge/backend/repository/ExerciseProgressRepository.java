package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ExerciseProgress;
import com.deutschbridge.backend.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExerciseProgressRepository extends JpaRepository<ExerciseProgress, String> {

    List<ExerciseProgress> findByUser(User user);

    Optional<ExerciseProgress> findByUserAndQuestionKey(User user, String questionKey);

    @Modifying
    @Query("DELETE FROM ExerciseProgress e WHERE e.user = :user")
    void deleteAllByUser(@Param("user") User user);

    @Modifying
    @Query("DELETE FROM ExerciseProgress e WHERE e.user = :user AND e.questionKey IN :questionKeys")
    void deleteByUserAndQuestionKeyIn(@Param("user") User user, @Param("questionKeys") List<String> questionKeys);
}
