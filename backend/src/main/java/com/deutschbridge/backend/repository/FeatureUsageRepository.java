package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.FeatureUsage;
import com.deutschbridge.backend.model.enums.FeatureType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FeatureUsageRepository extends JpaRepository<FeatureUsage, String> {

    Optional<FeatureUsage> findByUserIdAndFeatureTypeAndUsageDate(String userId, FeatureType featureType, LocalDate usageDate);

    List<FeatureUsage> findByUsageDate(LocalDate usageDate);

    @Query("SELECT COALESCE(SUM(f.count), 0) FROM FeatureUsage f WHERE f.usageDate = :date")
    long sumCountByUsageDate(@Param("date") LocalDate date);

    @Query("SELECT COALESCE(SUM(f.count), 0) FROM FeatureUsage f WHERE f.featureType = :featureType AND f.usageDate BETWEEN :start AND :end")
    long sumCountByFeatureTypeAndUsageDateBetween(@Param("featureType") FeatureType featureType,
                                                   @Param("start") LocalDate start,
                                                   @Param("end") LocalDate end);
}
