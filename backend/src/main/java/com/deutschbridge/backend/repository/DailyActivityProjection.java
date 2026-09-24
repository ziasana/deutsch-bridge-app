package com.deutschbridge.backend.repository;

import java.time.LocalDate;

/** Row shape for a per-day learner-activity aggregate: unique learners and activity volume. */
public interface DailyActivityProjection {
    LocalDate getDay();
    Long getActiveLearners();
    Long getActivities();
}
