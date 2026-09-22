package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ExamAttempt;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, String> {

    void deleteByExercise(ExamExercise exercise);

    List<ExamAttempt> findByUser(User user);
}
