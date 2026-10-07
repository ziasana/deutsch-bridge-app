package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.exception.FeatureLimitExceededException;
import com.deutschbridge.backend.model.dto.AiUsageResponse;
import com.deutschbridge.backend.model.dto.DownloadAccessResponse;
import com.deutschbridge.backend.model.entity.FeatureLimit;
import com.deutschbridge.backend.model.entity.FeatureUsage;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.AccountType;
import com.deutschbridge.backend.model.enums.FeatureType;
import com.deutschbridge.backend.repository.FeatureUsageRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.EnumMap;
import java.util.Map;

/**
 * Single place that decides whether a user may use a gated AI feature right now, and records the
 * usage when they do. Keeps the "can user use feature?" decision (global Premium switch -> the
 * user's account type -> the configured limit -> today's usage) out of the individual AI-calling
 * services, so a new feature only needs one consume() call instead of a bespoke `if PREMIUM` check.
 *
 * The global Premium switch is a hard kill switch, not just a default account type: while it's
 * off, entitlements aren't enforced at all (so the app can be tested/demoed without hitting daily
 * caps); once it's turned on, Basic and Premium users are held to their configured limits.
 */
@Service
public class EntitlementService {

    private final AppSettingService appSettingService;
    private final FeatureLimitService featureLimitService;
    private final FeatureUsageRepository featureUsageRepository;
    private final UserService userService;

    public EntitlementService(AppSettingService appSettingService,
                               FeatureLimitService featureLimitService,
                               FeatureUsageRepository featureUsageRepository,
                               UserService userService) {
        this.appSettingService = appSettingService;
        this.featureLimitService = featureLimitService;
        this.featureUsageRepository = featureUsageRepository;
        this.userService = userService;
    }

    /**
     * Checks that {@code userId} may use {@code featureType} today, and if so records one unit of
     * usage. Throws {@link FeatureLimitExceededException} if the feature is disabled or the daily
     * limit has already been reached. A no-op while the global Premium switch is off.
     */
    @Transactional
    public void consume(String userId, FeatureType featureType) {
        if (!appSettingService.isPremiumEnabled()) {
            return;
        }

        AccountType effectiveAccountType = resolveEffectiveAccountType(userId);
        FeatureLimit limit = featureLimitService.get(featureType, effectiveAccountType);

        if (!limit.isEnabled()) {
            throw new FeatureLimitExceededException("This feature is currently unavailable.");
        }

        LocalDate today = LocalDate.now();
        FeatureUsage usage = featureUsageRepository.findByUserIdAndFeatureTypeAndUsageDate(userId, featureType, today)
                .orElseGet(() -> {
                    FeatureUsage created = new FeatureUsage();
                    created.setUserId(userId);
                    created.setFeatureType(featureType);
                    created.setUsageDate(today);
                    created.setCount(0);
                    return created;
                });

        if (usage.getCount() >= limit.getDailyLimit()) {
            throw new FeatureLimitExceededException(
                    "Daily limit reached for this feature (" + limit.getDailyLimit() + "/day). Try again tomorrow.");
        }

        usage.setCount(usage.getCount() + 1);
        featureUsageRepository.save(usage);
    }

    /** Read-only view of {@link #consume}'s decision: today's limit and remaining uses per feature. */
    public AiUsageResponse usageFor(String userId) {
        Map<FeatureType, AiUsageResponse.FeatureUsageDto> features = new EnumMap<>(FeatureType.class);
        if (!appSettingService.isPremiumEnabled()) {
            return new AiUsageResponse(false, features);
        }
        AccountType accountType = resolveEffectiveAccountType(userId);
        LocalDate today = LocalDate.now();
        for (FeatureType type : FeatureType.values()) {
            FeatureLimit limit = featureLimitService.get(type, accountType);
            int used = featureUsageRepository.findByUserIdAndFeatureTypeAndUsageDate(userId, type, today)
                    .map(FeatureUsage::getCount).orElse(0);
            features.put(type, new AiUsageResponse.FeatureUsageDto(
                    limit.getDailyLimit(), used, Math.max(0, limit.getDailyLimit() - used), limit.isEnabled()));
        }
        return new AiUsageResponse(true, features);
    }

    /**
     * Whether {@code userId} may download content for offline use. Open to everyone unless the admin
     * restricts downloads to Premium; like the AI limits, that restriction only applies while the
     * global Premium switch is on.
     */
    public DownloadAccessResponse downloadAccessFor(String userId) {
        boolean premiumOnly = appSettingService.isDownloadsPremiumOnly();
        boolean restricted = premiumOnly && appSettingService.isPremiumEnabled();
        boolean allowed = !restricted || resolveEffectiveAccountType(userId) == AccountType.PREMIUM;
        return new DownloadAccessResponse(allowed, premiumOnly);
    }

    /** The account type whose limit applies to this user, once Premium is enabled. */
    private AccountType resolveEffectiveAccountType(String userId) {
        try {
            User user = userService.findById(userId);
            return user.getAccountType() != null ? user.getAccountType() : AccountType.BASIC;
        } catch (DataNotFoundException e) {
            return AccountType.BASIC;
        }
    }
}
