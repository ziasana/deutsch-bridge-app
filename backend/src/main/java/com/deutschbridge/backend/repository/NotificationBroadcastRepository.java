package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.NotificationBroadcast;
import com.deutschbridge.backend.model.enums.NotificationBroadcastStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface NotificationBroadcastRepository extends JpaRepository<NotificationBroadcast, String> {

    Page<NotificationBroadcast> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<NotificationBroadcast> findByStatusAndScheduledAtLessThanEqual(NotificationBroadcastStatus status, Instant now);
}
