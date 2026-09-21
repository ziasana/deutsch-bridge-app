package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.FeatureUsage;
import com.deutschbridge.backend.model.enums.FeatureType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface FeatureUsageRepository extends JpaRepository<FeatureUsage, String> {

    Optional<FeatureUsage> findByUserIdAndFeatureTypeAndUsageDate(String userId, FeatureType featureType, LocalDate usageDate);
}
