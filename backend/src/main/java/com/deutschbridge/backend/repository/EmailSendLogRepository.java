package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.EmailSendLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmailSendLogRepository extends JpaRepository<EmailSendLog, String> {

    List<EmailSendLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
