package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.AdminBroadcastPageResponse;
import com.deutschbridge.backend.model.dto.AdminNotificationSettingsDto;
import com.deutschbridge.backend.model.dto.ApiResponse;
import com.deutschbridge.backend.model.dto.NotificationAnalyticsResponse;
import com.deutschbridge.backend.model.dto.NotificationBroadcastRequest;
import com.deutschbridge.backend.model.dto.NotificationBroadcastResponse;
import com.deutschbridge.backend.model.dto.NotificationTemplateDto;
import com.deutschbridge.backend.model.enums.AccountType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.NotificationAudienceType;
import com.deutschbridge.backend.model.enums.NotificationType;
import com.deutschbridge.backend.model.enums.PreferredLanguage;
import com.deutschbridge.backend.service.AdminAuditLogService;
import com.deutschbridge.backend.service.notification.NotificationBroadcastService;
import com.deutschbridge.backend.service.notification.NotificationScheduler;
import com.deutschbridge.backend.service.notification.NotificationService;
import com.deutschbridge.backend.service.notification.NotificationSettingsService;
import com.deutschbridge.backend.service.notification.NotificationTemplateService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Admin > Notifications: global limits and switches, localized templates, and the conversion funnel. */
@RestController
@RequestMapping("/api/admin/notifications")
@PreAuthorize("hasRole('ADMIN')")
public class AdminNotificationController {

    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");

    private final NotificationSettingsService settingsService;
    private final NotificationTemplateService templateService;
    private final NotificationService notificationService;
    private final NotificationScheduler notificationScheduler;
    private final NotificationBroadcastService broadcastService;
    private final AdminAuditLogService adminAuditLogService;
    private final RequestContext requestContext;

    public AdminNotificationController(NotificationSettingsService settingsService,
                                       NotificationTemplateService templateService,
                                       NotificationService notificationService,
                                       NotificationScheduler notificationScheduler,
                                       NotificationBroadcastService broadcastService,
                                       AdminAuditLogService adminAuditLogService,
                                       RequestContext requestContext) {
        this.settingsService = settingsService;
        this.templateService = templateService;
        this.notificationService = notificationService;
        this.notificationScheduler = notificationScheduler;
        this.broadcastService = broadcastService;
        this.adminAuditLogService = adminAuditLogService;
        this.requestContext = requestContext;
    }

    @GetMapping("/settings")
    public AdminNotificationSettingsDto getSettings() {
        return toDto(settingsService.get());
    }

    @PutMapping("/settings")
    public ResponseEntity<ApiResponse<AdminNotificationSettingsDto>> updateSettings(@RequestBody AdminNotificationSettingsDto request) {
        AdminNotificationSettingsDto previous = toDto(settingsService.get());

        Map<NotificationType, Boolean> types = new EnumMap<>(NotificationType.class);
        if (request.types() != null) {
            request.types().forEach((type, enabled) -> types.put(NotificationType.valueOf(type), Boolean.TRUE.equals(enabled)));
        }
        NotificationSettingsService.GlobalSettings updated = settingsService.update(new NotificationSettingsService.GlobalSettings(
                request.enabled(),
                request.maxLearningPerDay(),
                request.maxReminderPerDay(),
                parseTime(request.defaultReminderTime()),
                parseTime(request.quietHoursStart()),
                parseTime(request.quietHoursEnd()),
                types,
                request.minGapMinutes(),
                request.testModeEnabled(),
                request.testUserEmails() != null ? request.testUserEmails() : List.of()));
        AdminNotificationSettingsDto result = toDto(updated);

        adminAuditLogService.record(requestContext.getUserId(), requestContext.getUserEmail(),
                "NOTIFICATION_SETTINGS_UPDATED", previous + " -> " + result);
        return ResponseEntity.ok(new ApiResponse<>("Notification settings updated", result));
    }

    @GetMapping("/templates")
    public List<NotificationTemplateDto> getTemplates() {
        return templateService.findAll();
    }

    @PutMapping("/templates")
    public ResponseEntity<ApiResponse<List<NotificationTemplateDto>>> updateTemplates(@RequestBody List<NotificationTemplateDto> request) {
        List<NotificationTemplateDto> result = templateService.update(request);
        adminAuditLogService.record(requestContext.getUserId(), requestContext.getUserEmail(),
                "NOTIFICATION_TEMPLATES_UPDATED",
                request.stream().map(t -> t.templateKey() + "/" + t.language()).toList().toString());
        return ResponseEntity.ok(new ApiResponse<>("Notification templates updated", result));
    }

    @GetMapping("/analytics")
    public NotificationAnalyticsResponse getAnalytics(@RequestParam(defaultValue = "30") int days) {
        return notificationService.analytics(days);
    }

    /**
     * Runs the evaluation sweep immediately instead of waiting for the next scheduled run. With test
     * mode on, listed test learners skip timing rules (quiet hours, limits, gap, dedup) in this run.
     */
    @PostMapping("/run-sweep")
    public ResponseEntity<ApiResponse<Void>> runSweep() {
        notificationScheduler.sweep(true);
        return ResponseEntity.ok(new ApiResponse<>("Notification sweep completed", null));
    }

    @GetMapping("/broadcasts")
    public AdminBroadcastPageResponse listBroadcasts(@RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "20") int size) {
        return broadcastService.list(page, size);
    }

    @PostMapping("/broadcasts")
    public ResponseEntity<ApiResponse<NotificationBroadcastResponse>> createBroadcast(@RequestBody NotificationBroadcastRequest request) {
        NotificationBroadcastResponse result = broadcastService.create(request, requestContext.getUserId(), requestContext.getUserEmail());
        adminAuditLogService.record(requestContext.getUserId(), requestContext.getUserEmail(),
                "NOTIFICATION_BROADCAST_CREATED", result.id() + " -> " + result.status());
        return ResponseEntity.ok(new ApiResponse<>("Notification broadcast created", result));
    }

    @PutMapping("/broadcasts/{id}")
    public ResponseEntity<ApiResponse<NotificationBroadcastResponse>> updateBroadcast(@PathVariable String id,
                                                                                       @RequestBody NotificationBroadcastRequest request) throws DataNotFoundException {
        NotificationBroadcastResponse result = broadcastService.update(id, request);
        adminAuditLogService.record(requestContext.getUserId(), requestContext.getUserEmail(),
                "NOTIFICATION_BROADCAST_UPDATED", result.id() + " -> " + result.status());
        return ResponseEntity.ok(new ApiResponse<>("Notification broadcast updated", result));
    }

    @DeleteMapping("/broadcasts/{id}")
    public ResponseEntity<ApiResponse<Void>> cancelBroadcast(@PathVariable String id) throws DataNotFoundException {
        broadcastService.cancel(id);
        adminAuditLogService.record(requestContext.getUserId(), requestContext.getUserEmail(),
                "NOTIFICATION_BROADCAST_CANCELLED", id);
        return ResponseEntity.ok(new ApiResponse<>("Notification broadcast cancelled", null));
    }

    @GetMapping("/broadcasts/audience-count")
    public ResponseEntity<ApiResponse<Long>> audienceCount(@RequestParam NotificationAudienceType audienceType,
                                                            @RequestParam(required = false) LearningLevel level,
                                                            @RequestParam(required = false) AccountType accountType,
                                                            @RequestParam(required = false) PreferredLanguage language,
                                                            @RequestParam(required = false) List<String> userIds) {
        return ResponseEntity.ok(new ApiResponse<>(null, broadcastService.audienceCount(audienceType, level, accountType, language, userIds)));
    }

    private static AdminNotificationSettingsDto toDto(NotificationSettingsService.GlobalSettings s) {
        Map<String, Boolean> types = new LinkedHashMap<>();
        NotificationSettingsService.MANAGED_TYPES.forEach(t -> types.put(t.name(), s.isTypeEnabled(t)));
        return new AdminNotificationSettingsDto(s.enabled(), s.maxLearningPerDay(), s.maxReminderPerDay(),
                s.defaultReminderTime().format(HH_MM), s.quietHoursStart().format(HH_MM), s.quietHoursEnd().format(HH_MM), types,
                s.minGapMinutes(), s.testModeEnabled(), s.testUserEmails());
    }

    private static LocalTime parseTime(String value) {
        try {
            return LocalTime.parse(value);
        } catch (DateTimeParseException | NullPointerException e) {
            throw new IllegalArgumentException("Invalid time: " + value);
        }
    }
}
