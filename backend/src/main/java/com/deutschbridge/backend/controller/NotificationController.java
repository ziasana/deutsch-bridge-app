package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ApiResponse;
import com.deutschbridge.backend.model.dto.NotificationPageResponse;
import com.deutschbridge.backend.model.dto.NotificationResponse;
import com.deutschbridge.backend.model.dto.UnreadCountResponse;
import com.deutschbridge.backend.model.enums.NotificationCategory;
import com.deutschbridge.backend.service.notification.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** The learner's in-app notification center. Every endpoint is scoped to the authenticated learner. */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final RequestContext requestContext;

    public NotificationController(NotificationService notificationService, RequestContext requestContext) {
        this.notificationService = notificationService;
        this.requestContext = requestContext;
    }

    @GetMapping
    public NotificationPageResponse list(@RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "20") int size,
                                         @RequestParam(required = false) List<NotificationCategory> category,
                                         @RequestParam(defaultValue = "false") boolean unread) {
        return notificationService.list(requestContext.getUserId(), page, size, category, unread);
    }

    @GetMapping("/unread-count")
    public UnreadCountResponse unreadCount() {
        return new UnreadCountResponse(notificationService.unreadCount(requestContext.getUserId()));
    }

    @PatchMapping("/{id}/read")
    public NotificationResponse markRead(@PathVariable String id) throws DataNotFoundException {
        return notificationService.markRead(requestContext.getUserId(), id);
    }

    @PostMapping("/read-all")
    public ResponseEntity<ApiResponse<Integer>> markAllRead() {
        int updated = notificationService.markAllRead(requestContext.getUserId());
        return ResponseEntity.ok(new ApiResponse<>("Notifications marked as read", updated));
    }

    /** Marks read, records the click and returns the notification with its structured actionUrl. */
    @PostMapping("/{id}/click")
    public NotificationResponse click(@PathVariable String id) throws DataNotFoundException {
        return notificationService.click(requestContext.getUserId(), id);
    }
}
