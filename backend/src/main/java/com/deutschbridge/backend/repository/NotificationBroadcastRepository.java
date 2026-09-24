package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.NotificationBroadcast;
import com.deutschbridge.backend.model.enums.NotificationBroadcastStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Repository
public interface NotificationBroadcastRepository extends JpaRepository<NotificationBroadcast, String> {

    Page<NotificationBroadcast> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<NotificationBroadcast> findByStatusAndScheduledAtLessThanEqual(NotificationBroadcastStatus status, Instant now);

    /**
     * Atomically claims a broadcast for sending: flips SCHEDULED -> SENT only if it's still SCHEDULED,
     * in one row-locking UPDATE. Postgres serializes concurrent UPDATEs to the same row, so if the
     * admin's "edit and send now" and the scheduler's dispatchDueBroadcasts() race for the same
     * broadcast, only one of them can affect a row here - the loser sees 0 rows updated and skips
     * dispatch entirely instead of racing to insert the same Notification rows twice.
     */
    @Modifying
    @Transactional
    @Query("UPDATE NotificationBroadcast b SET b.status = com.deutschbridge.backend.model.enums.NotificationBroadcastStatus.SENT, " +
            "b.sentAt = :now, b.updatedAt = :now " +
            "WHERE b.id = :id AND b.status = com.deutschbridge.backend.model.enums.NotificationBroadcastStatus.SCHEDULED")
    int claimForSending(@Param("id") String id, @Param("now") Instant now);

    /** Records a failed dispatch attempt in its own transaction, independent of the failed send()'s
     * rolled-back one, so a SCHEDULED broadcast stuck retrying is visible to admins. */
    @Modifying
    @Transactional
    @Query("UPDATE NotificationBroadcast b SET b.lastDispatchError = :error, b.lastDispatchAttemptAt = :now WHERE b.id = :id")
    void recordDispatchFailure(@Param("id") String id, @Param("error") String error, @Param("now") Instant now);
}
