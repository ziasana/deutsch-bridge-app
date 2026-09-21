package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.AdminAuditLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, String> {

    List<AdminAuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
