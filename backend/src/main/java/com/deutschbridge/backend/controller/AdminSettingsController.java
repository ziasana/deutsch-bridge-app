package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.model.dto.AdminAuditLogResponse;
import com.deutschbridge.backend.model.dto.ApiResponse;
import com.deutschbridge.backend.model.dto.FeatureLimitResponse;
import com.deutschbridge.backend.model.dto.FeatureLimitUpdateRequest;
import com.deutschbridge.backend.model.dto.PremiumSettingRequest;
import com.deutschbridge.backend.model.dto.PremiumSettingResponse;
import com.deutschbridge.backend.model.entity.FeatureLimit;
import com.deutschbridge.backend.model.enums.AccountType;
import com.deutschbridge.backend.model.enums.FeatureType;
import com.deutschbridge.backend.service.AdminAuditLogService;
import com.deutschbridge.backend.service.AppSettingService;
import com.deutschbridge.backend.service.FeatureLimitService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Monetization & Limits: the global Premium switch, per-feature daily limits, and their audit trail. */
@RestController
@RequestMapping("/api/admin/settings")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSettingsController {

    private final AppSettingService appSettingService;
    private final FeatureLimitService featureLimitService;
    private final AdminAuditLogService adminAuditLogService;
    private final RequestContext requestContext;

    public AdminSettingsController(AppSettingService appSettingService,
                                    FeatureLimitService featureLimitService,
                                    AdminAuditLogService adminAuditLogService,
                                    RequestContext requestContext) {
        this.appSettingService = appSettingService;
        this.featureLimitService = featureLimitService;
        this.adminAuditLogService = adminAuditLogService;
        this.requestContext = requestContext;
    }

    @GetMapping("/premium")
    public PremiumSettingResponse getPremiumSetting() {
        return new PremiumSettingResponse(appSettingService.isPremiumEnabled());
    }

    @PutMapping("/premium")
    public ResponseEntity<ApiResponse<PremiumSettingResponse>> updatePremiumSetting(@RequestBody @Valid PremiumSettingRequest request) {
        boolean previous = appSettingService.isPremiumEnabled();
        appSettingService.setPremiumEnabled(request.enabled());

        adminAuditLogService.record(
                requestContext.getUserId(),
                requestContext.getUserEmail(),
                "PREMIUM_SYSTEM_TOGGLED",
                "Premium enabled: " + previous + " -> " + request.enabled()
        );

        return ResponseEntity.ok(new ApiResponse<>("Premium setting updated", new PremiumSettingResponse(request.enabled())));
    }

    @GetMapping("/feature-limits")
    public List<FeatureLimitResponse> getFeatureLimits() {
        return featureLimitService.findAll().stream()
                .map(FeatureLimitResponse::fromEntity)
                .toList();
    }

    @PutMapping("/feature-limits")
    public ResponseEntity<ApiResponse<List<FeatureLimitResponse>>> updateFeatureLimits(
            @RequestBody @Valid List<FeatureLimitUpdateRequest> requests
    ) {
        List<FeatureLimit> updated = requests.stream()
                .map(this::applyUpdate)
                .toList();

        return ResponseEntity.ok(new ApiResponse<>("Feature limits updated",
                updated.stream().map(FeatureLimitResponse::fromEntity).toList()));
    }

    private FeatureLimit applyUpdate(FeatureLimitUpdateRequest request) {
        FeatureType featureType = FeatureType.valueOf(request.featureType());
        AccountType accountType = AccountType.valueOf(request.accountType());
        FeatureLimit previous = featureLimitService.get(featureType, accountType);
        int previousLimit = previous.getDailyLimit();
        boolean previousEnabled = previous.isEnabled();

        FeatureLimit updated = featureLimitService.update(featureType, accountType, request.dailyLimit(), request.enabled());

        if (updated.getDailyLimit() != previousLimit || updated.isEnabled() != previousEnabled) {
            adminAuditLogService.record(
                    requestContext.getUserId(),
                    requestContext.getUserEmail(),
                    "FEATURE_LIMIT_UPDATED",
                    featureType + "/" + accountType + ": limit " + previousLimit + " -> " + updated.getDailyLimit()
                            + ", enabled " + previousEnabled + " -> " + updated.isEnabled()
            );
        }
        return updated;
    }

    @GetMapping("/audit-log")
    public List<AdminAuditLogResponse> getAuditLog() {
        return adminAuditLogService.findRecent().stream()
                .map(AdminAuditLogResponse::fromEntity)
                .toList();
    }
}
