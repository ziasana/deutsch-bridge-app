package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.NotificationPreference;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, String> {

    Optional<NotificationPreference> findByUserId(String userId);

    /** Learners who could receive at least one notification kind; paged so a sweep never loads everyone. */
    @Query("SELECT p FROM NotificationPreference p " +
            "WHERE p.learningRemindersEnabled = true OR p.progressNotificationsEnabled = true ORDER BY p.id")
    Slice<NotificationPreference> findSweepable(Pageable pageable);

    /**
     * Learners whose preferred reminder time falls within the last {@code windowSeconds} of their own
     * local clock. The modulo keeps the window correct across local midnight. PostgreSQL-specific.
     */
    @Query(value = "SELECT p.user_id FROM notification_preferences p " +
            "WHERE p.learning_reminders_enabled = true AND p.preferred_reminder_time IS NOT NULL " +
            "AND MOD(CAST(EXTRACT(EPOCH FROM CAST(timezone(COALESCE(p.timezone, :defaultZone), CURRENT_TIMESTAMP) AS time)) " +
            "- EXTRACT(EPOCH FROM p.preferred_reminder_time) + 86400 AS numeric), 86400) < :windowSeconds",
            nativeQuery = true)
    List<String> findUserIdsAtReminderTime(@Param("defaultZone") String defaultZone,
                                           @Param("windowSeconds") int windowSeconds);

    /** Learner accounts that don't have a preference row yet (created before this feature). */
    @Query("SELECT u.id FROM User u WHERE (u.role IS NULL OR u.role <> 'ADMIN') " +
            "AND NOT EXISTS (SELECT 1 FROM NotificationPreference p WHERE p.userId = u.id)")
    List<String> findUserIdsWithoutPreference(Pageable pageable);
}
