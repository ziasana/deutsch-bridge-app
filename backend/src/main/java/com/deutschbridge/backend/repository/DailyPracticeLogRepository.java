package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.DailyPracticeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DailyPracticeLogRepository extends JpaRepository<DailyPracticeLog,String> {
}
