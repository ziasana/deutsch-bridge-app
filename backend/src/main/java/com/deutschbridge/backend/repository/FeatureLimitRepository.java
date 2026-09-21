package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.FeatureLimit;
import com.deutschbridge.backend.model.enums.AccountType;
import com.deutschbridge.backend.model.enums.FeatureType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FeatureLimitRepository extends JpaRepository<FeatureLimit, String> {

    Optional<FeatureLimit> findByFeatureTypeAndAccountType(FeatureType featureType, AccountType accountType);
}
