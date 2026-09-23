package com.deutschbridge.backend.model.dto;

import java.util.List;

/**
 * Notification -> learning funnel for the admin. "Started" is a click (the click deep-links straight
 * into the activity); "completed" means the learning opportunity was resolved after the click.
 */
public record NotificationAnalyticsResponse(
        int days,
        FunnelRow totals,
        List<FunnelRow> byType
) {
    public record FunnelRow(
            String type,
            long sent,
            long opened,
            long clicked,
            long completed,
            double clickRate,
            double conversionRate
    ) {
        public static FunnelRow of(String type, long sent, long opened, long clicked, long completed) {
            return new FunnelRow(type, sent, opened, clicked, completed,
                    sent == 0 ? 0 : (double) clicked / sent,
                    sent == 0 ? 0 : (double) completed / sent);
        }
    }
}
