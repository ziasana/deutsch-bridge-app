package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.model.dto.DownloadAccessResponse;
import com.deutschbridge.backend.service.EntitlementService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Lets clients know whether to offer offline downloads to the signed-in learner. */
@RestController
@RequestMapping("/api/downloads")
public class DownloadAccessController {

    private final EntitlementService entitlementService;
    private final RequestContext requestContext;

    public DownloadAccessController(EntitlementService entitlementService, RequestContext requestContext) {
        this.entitlementService = entitlementService;
        this.requestContext = requestContext;
    }

    @GetMapping("/access")
    public DownloadAccessResponse access() {
        return entitlementService.downloadAccessFor(requestContext.getUserId());
    }
}
