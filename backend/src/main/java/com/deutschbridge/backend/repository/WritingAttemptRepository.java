package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.WritingAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WritingAttemptRepository extends JpaRepository<WritingAttempt, String> {

    List<WritingAttempt> findByUserIdAndExerciseIdOrderByAttemptNumberAsc(String userId, String exerciseId);

    List<WritingAttempt> findByUserIdOrderBySubmittedAtDesc(String userId);

    int countByUserIdAndExerciseId(String userId, String exerciseId);
}
