package com.deutschbridge.backend.model.dto.recommendation;

import com.deutschbridge.backend.model.enums.NotificationPriority;

/**
 * One concrete "do this next" learning action. The Dashboard renders the top one as its hero card and
 * the notification rules turn the same recommendations into "come back and do this" messages.
 *
 * @param title          content-specific title (lesson/article/exercise name), null for generic activities
 * @param progressPercent only set when partial progress on the activity is meaningful (daily words)
 */
public record LearningRecommendation(
        RecommendationType type,
        String title,
        Integer progressPercent,
        int completed,
        int total,
        int durationMinutes,
        NotificationPriority priority,
        String entityType,
        String entityId,
        String actionUrl
) {
}
