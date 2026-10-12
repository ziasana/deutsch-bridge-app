package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ExamSimulationUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Set;

@Repository
public interface ExamSimulationUsageRepository extends JpaRepository<ExamSimulationUsage, String> {

    @Query("SELECT u.exerciseId FROM ExamSimulationUsage u WHERE u.userId = :userId AND u.profileCode = :code")
    Set<String> findExerciseIds(@Param("userId") String userId, @Param("code") String profileCode);

    /** Per user, how many of the given exercises were reserved - used for the admin "minimum remaining" figure. */
    @Query("SELECT u.userId AS userId, COUNT(u) AS used FROM ExamSimulationUsage u WHERE u.profileCode = :code AND u.exerciseId IN :ids GROUP BY u.userId")
    List<UsageCount> countByUserForExercises(@Param("code") String profileCode, @Param("ids") Collection<String> exerciseIds);

    interface UsageCount {
        String getUserId();

        long getUsed();
    }

    long countByUserIdAndProfileCode(String userId, String profileCode);
}
