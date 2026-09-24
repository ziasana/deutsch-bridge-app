package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.LearningActivity;
import com.deutschbridge.backend.model.enums.LearningModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface LearningActivityRepository extends JpaRepository<LearningActivity, String> {

    @Query("SELECT COUNT(DISTINCT a.userId) FROM LearningActivity a WHERE a.createdAt BETWEEN :start AND :end")
    long countDistinctUserIdByCreatedAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(DISTINCT a.userId) FROM LearningActivity a WHERE a.createdAt BETWEEN :start AND :end AND a.userId IN :userIds")
    long countDistinctUserIdByCreatedAtBetweenAndUserIdIn(@Param("start") LocalDateTime start,
                                                           @Param("end") LocalDateTime end,
                                                           @Param("userIds") Collection<String> userIds);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    long countByModuleAndCreatedAtBetween(LearningModule module, LocalDateTime start, LocalDateTime end);

    @Query("""
            SELECT CAST(a.createdAt AS localdate) AS day,
                   COUNT(DISTINCT a.userId) AS activeLearners,
                   COUNT(a) AS activities
            FROM LearningActivity a
            WHERE a.createdAt BETWEEN :start AND :end
            GROUP BY CAST(a.createdAt AS localdate)
            """)
    List<DailyActivityProjection> dailySeries(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("""
            SELECT a.module AS module,
                   COUNT(DISTINCT a.userId) AS uniqueLearners,
                   COUNT(a) AS activities
            FROM LearningActivity a
            WHERE a.createdAt BETWEEN :start AND :end
            GROUP BY a.module
            """)
    List<ModuleUsageProjection> moduleUsage(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("""
            SELECT a.module AS module,
                   COUNT(DISTINCT a.userId) AS uniqueLearners,
                   COUNT(a) AS activities
            FROM LearningActivity a
            WHERE a.createdAt BETWEEN :start AND :end AND a.userId IN :userIds
            GROUP BY a.module
            """)
    List<ModuleUsageProjection> moduleUsageForUsers(@Param("start") LocalDateTime start,
                                                     @Param("end") LocalDateTime end,
                                                     @Param("userIds") Collection<String> userIds);
}
