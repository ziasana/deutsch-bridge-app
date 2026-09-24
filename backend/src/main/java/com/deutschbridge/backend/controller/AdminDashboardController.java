package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.model.dto.AdminAnalyticsResponse;
import com.deutschbridge.backend.model.dto.AdminDashboardResponse;
import com.deutschbridge.backend.service.AdminAnalyticsService;
import com.deutschbridge.backend.service.AdminDashboardService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Read-only aggregates for the admin dashboard landing page - see {@link AdminDashboardService}
 *  and, for the Learner Activity / Content & Feature Usage sections, {@link AdminAnalyticsService}. */
@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;
    private final AdminAnalyticsService adminAnalyticsService;

    public AdminDashboardController(AdminDashboardService adminDashboardService, AdminAnalyticsService adminAnalyticsService) {
        this.adminDashboardService = adminDashboardService;
        this.adminAnalyticsService = adminAnalyticsService;
    }

    @GetMapping
    public AdminDashboardResponse getDashboard() {
        return adminDashboardService.build();
    }

    @GetMapping("/analytics")
    public AdminAnalyticsResponse getAnalytics(@RequestParam(required = false, defaultValue = "30d") String range,
                                                @RequestParam(required = false, defaultValue = "ALL") String level) {
        return adminAnalyticsService.build(range, level);
    }
}
