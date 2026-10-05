package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.model.dto.AiUsageResponse;
import com.deutschbridge.backend.service.EntitlementService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Lets clients show "N left today" for the gated AI features. */
@RestController
@RequestMapping("/api/ai-usage")
public class AiUsageController {

    private final EntitlementService entitlementService;
    private final RequestContext requestContext;

    public AiUsageController(EntitlementService entitlementService, RequestContext requestContext) {
        this.entitlementService = entitlementService;
        this.requestContext = requestContext;
    }

    @GetMapping
    public AiUsageResponse usage() {
        return entitlementService.usageFor(requestContext.getUserId());
    }
}
