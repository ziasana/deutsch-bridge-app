package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.FeatureLimit;
import com.deutschbridge.backend.model.enums.AccountType;
import com.deutschbridge.backend.model.enums.FeatureType;
import com.deutschbridge.backend.repository.FeatureLimitRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/** Owns the admin-configurable per-feature, per-account-type daily usage limits and their defaults. */
@Service
public class FeatureLimitService {

    private static final Map<FeatureType, Integer> DEFAULT_BASIC_LIMITS = new EnumMap<>(FeatureType.class);
    private static final Map<FeatureType, Integer> DEFAULT_PREMIUM_LIMITS = new EnumMap<>(FeatureType.class);

    static {
        DEFAULT_BASIC_LIMITS.put(FeatureType.AI_CHAT, 5);
        DEFAULT_BASIC_LIMITS.put(FeatureType.AI_CORRECTION, 3);
        DEFAULT_BASIC_LIMITS.put(FeatureType.AI_EXAMPLE, 5);
        DEFAULT_BASIC_LIMITS.put(FeatureType.AI_SYNONYM, 5);

        DEFAULT_PREMIUM_LIMITS.put(FeatureType.AI_CHAT, 100);
        DEFAULT_PREMIUM_LIMITS.put(FeatureType.AI_CORRECTION, 50);
        DEFAULT_PREMIUM_LIMITS.put(FeatureType.AI_EXAMPLE, 100);
        DEFAULT_PREMIUM_LIMITS.put(FeatureType.AI_SYNONYM, 100);
    }

    private final FeatureLimitRepository featureLimitRepository;

    public FeatureLimitService(FeatureLimitRepository featureLimitRepository) {
        this.featureLimitRepository = featureLimitRepository;
    }

    @PostConstruct
    public void seedDefaults() {
        for (FeatureType featureType : FeatureType.values()) {
            seedIfMissing(featureType, AccountType.BASIC, DEFAULT_BASIC_LIMITS.get(featureType));
            seedIfMissing(featureType, AccountType.PREMIUM, DEFAULT_PREMIUM_LIMITS.get(featureType));
        }
    }

    private void seedIfMissing(FeatureType featureType, AccountType accountType, int dailyLimit) {
        featureLimitRepository.findByFeatureTypeAndAccountType(featureType, accountType).orElseGet(() -> {
            FeatureLimit limit = new FeatureLimit();
            limit.setFeatureType(featureType);
            limit.setAccountType(accountType);
            limit.setDailyLimit(dailyLimit);
            limit.setEnabled(true);
            return featureLimitRepository.save(limit);
        });
    }

    public List<FeatureLimit> findAll() {
        return featureLimitRepository.findAll();
    }

    public FeatureLimit get(FeatureType featureType, AccountType accountType) {
        return featureLimitRepository.findByFeatureTypeAndAccountType(featureType, accountType)
                .orElseThrow(() -> new IllegalStateException("Missing feature limit for " + featureType + "/" + accountType));
    }

    public FeatureLimit update(FeatureType featureType, AccountType accountType, Integer dailyLimit, Boolean enabled) {
        FeatureLimit limit = get(featureType, accountType);
        if (dailyLimit != null) {
            if (dailyLimit < 0) throw new IllegalArgumentException("Daily limit cannot be negative");
            limit.setDailyLimit(dailyLimit);
        }
        if (enabled != null) limit.setEnabled(enabled);
        return featureLimitRepository.save(limit);
    }
}
