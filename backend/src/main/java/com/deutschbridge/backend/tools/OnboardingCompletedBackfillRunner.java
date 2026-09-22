package com.deutschbridge.backend.tools;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * The onboarding_completed column is new, so it defaults to false for every profile that already
 * existed before this feature shipped - including learners who already finished setting up their
 * level and daily-word goal through the old profile page. Without this, they'd get funneled into
 * the new signup onboarding wizard on their next login even though their profile is already
 * usable. Anyone whose profile already has a level and a daily-word goal is treated as configured;
 * everyone else (freshly registered, never finished the old profile form) still goes through
 * onboarding normally. Re-running this on every boot is idempotent - it only ever flips false to
 * true for profiles that already look complete.
 */
@Component
@Order(2)
public class OnboardingCompletedBackfillRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(OnboardingCompletedBackfillRunner.class);

    private final JdbcTemplate jdbcTemplate;

    public OnboardingCompletedBackfillRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        int updated = jdbcTemplate.update(
                "UPDATE user_profiles SET onboarding_completed = true " +
                        "WHERE onboarding_completed = false " +
                        "AND learning_level IS NOT NULL " +
                        "AND daily_goal_words IS NOT NULL");
        if (updated > 0) {
            log.info("Backfilled onboarding_completed=true for {} pre-existing user profile(s)", updated);
        }
    }
}
