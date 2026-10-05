package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.model.dto.PushDeviceRequest;
import com.deutschbridge.backend.service.push.PushDeviceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Registers the learner's mobile devices for push notifications. */
@RestController
@RequestMapping("/api/notifications/devices")
public class PushDeviceController {

    private final PushDeviceService pushDeviceService;
    private final RequestContext requestContext;

    public PushDeviceController(PushDeviceService pushDeviceService, RequestContext requestContext) {
        this.pushDeviceService = pushDeviceService;
        this.requestContext = requestContext;
    }

    @PostMapping
    public ResponseEntity<Void> register(@Valid @RequestBody PushDeviceRequest request) {
        pushDeviceService.register(requestContext.getUserId(), request.token(), request.platform());
        return ResponseEntity.noContent().build();
    }

    /** The token goes in the query: it contains brackets that don't belong in a path. */
    @DeleteMapping
    public ResponseEntity<Void> unregister(@RequestParam String token) {
        pushDeviceService.unregister(requestContext.getUserId(), token);
        return ResponseEntity.noContent().build();
    }
}
