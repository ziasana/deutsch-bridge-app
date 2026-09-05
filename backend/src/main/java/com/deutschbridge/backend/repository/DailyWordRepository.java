package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.DailyWord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DailyWordRepository extends JpaRepository<DailyWord, String> {

    @Query("SELECT d FROM DailyWord d ORDER BY d.id")
    List<DailyWord> findAllOrdered();
}
