package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.AdminAuditLog;
import com.deutschbridge.backend.repository.AdminAuditLogRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminAuditLogService {

    private static final int RECENT_LIMIT = 200;

    private final AdminAuditLogRepository adminAuditLogRepository;

    public AdminAuditLogService(AdminAuditLogRepository adminAuditLogRepository) {
        this.adminAuditLogRepository = adminAuditLogRepository;
    }

    public void record(String adminId, String adminEmail, String action, String details) {
        adminAuditLogRepository.save(new AdminAuditLog(adminId, adminEmail, action, details));
    }

    public List<AdminAuditLog> findRecent() {
        return adminAuditLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, RECENT_LIMIT));
    }
}
