package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.Notification;
import com.deutschbridge.backend.model.enums.NotificationCategory;
import com.deutschbridge.backend.model.enums.NotificationStatus;
import com.deutschbridge.backend.model.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {

    @Query("SELECT n FROM Notification n WHERE n.userId = :userId AND n.status IN :statuses " +
            "AND (:allCategories = true OR n.category IN :categories) " +
            "AND (:unreadOnly = false OR n.readAt IS NULL) " +
            "ORDER BY n.createdAt DESC")
    Page<Notification> findVisible(@Param("userId") String userId,
                                   @Param("statuses") Collection<NotificationStatus> statuses,
                                   @Param("allCategories") boolean allCategories,
                                   @Param("categories") Collection<NotificationCategory> categories,
                                   @Param("unreadOnly") boolean unreadOnly,
                                   Pageable pageable);

    long countByUserIdAndReadAtIsNullAndStatusIn(String userId, Collection<NotificationStatus> statuses);

    Optional<Notification> findByIdAndUserId(String id, String userId);

    Optional<Notification> findByUserIdAndDedupKey(String userId, String dedupKey);

    long countByUserIdAndCategoryAndSentAtGreaterThanEqualAndSentAtLessThan(
            String userId, NotificationCategory category, Instant from, Instant to);

    Optional<Notification> findFirstByUserIdAndCategoryInAndSentAtIsNotNullOrderBySentAtDesc(
            String userId, Collection<NotificationCategory> categories);

    /** Still-open notifications for state-based opportunities, used to detect when the learner resolved them. */
    List<Notification> findByUserIdAndTypeInAndCompletedAtIsNullAndStatusInAndCreatedAtAfter(
            String userId, Collection<NotificationType> types, Collection<NotificationStatus> statuses, Instant after);

    @Modifying
    @Query("UPDATE Notification n SET n.readAt = :now, n.status = com.deutschbridge.backend.model.enums.NotificationStatus.READ, " +
            "n.updatedAt = :now WHERE n.userId = :userId AND n.readAt IS NULL AND n.status IN :statuses")
    int markAllRead(@Param("userId") String userId,
                    @Param("statuses") Collection<NotificationStatus> statuses,
                    @Param("now") Instant now);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.status = com.deutschbridge.backend.model.enums.NotificationStatus.EXPIRED, " +
            "n.updatedAt = :now WHERE n.expiresAt < :now AND n.readAt IS NULL AND n.status IN :statuses")
    int expireOverdue(@Param("statuses") Collection<NotificationStatus> statuses, @Param("now") Instant now);

    /** Row: [type, sent, read, clicked, completed] - drives the admin conversion funnel. */
    @Query("SELECT n.type, COUNT(n), COUNT(n.readAt), COUNT(n.clickedAt), COUNT(n.completedAt) " +
            "FROM Notification n WHERE n.sentAt >= :since GROUP BY n.type")
    List<Object[]> aggregateFunnelByType(@Param("since") Instant since);
}
