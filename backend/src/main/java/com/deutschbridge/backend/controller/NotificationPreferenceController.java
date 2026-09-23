package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.model.dto.ApiResponse;
import com.deutschbridge.backend.model.dto.NotificationPreferenceDto;
import com.deutschbridge.backend.service.notification.NotificationPreferenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notification-preferences")
public class NotificationPreferenceController {

    private final NotificationPreferenceService preferenceService;
    private final RequestContext requestContext;

    public NotificationPreferenceController(NotificationPreferenceService preferenceService, RequestContext requestContext) {
        this.preferenceService = preferenceService;
        this.requestContext = requestContext;
    }

    @GetMapping
    public NotificationPreferenceDto get() {
        return preferenceService.getDto(requestContext.getUserId());
    }

    @PutMapping
    public ResponseEntity<ApiResponse<NotificationPreferenceDto>> update(@RequestBody NotificationPreferenceDto request) {
        NotificationPreferenceDto updated = preferenceService.update(requestContext.getUserId(), request);
        return ResponseEntity.ok(new ApiResponse<>("Notification preferences updated", updated));
    }
}
