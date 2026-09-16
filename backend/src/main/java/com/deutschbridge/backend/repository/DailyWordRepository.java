package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.DailyWord;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.LearningLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DailyWordRepository extends JpaRepository<DailyWord, String> {

    @Query("SELECT d FROM DailyWord d WHERE d.assignedTo IS NULL ORDER BY d.id")
    List<DailyWord> findAllOrdered();

    List<DailyWord> findByAssignedToAndAssignedDate(User user, LocalDate date);

    List<DailyWord> findByLevelAndAssignedToIsNull(LearningLevel level);

    long countByAssignedToIsNull();
}
