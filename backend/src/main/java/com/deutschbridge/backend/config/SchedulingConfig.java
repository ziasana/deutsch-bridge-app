package com.deutschbridge.backend.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.time.Clock;

/**
 * Spring's built-in scheduler runs the notification jobs (no external scheduling platform).
 * Set notifications.scheduler.enabled=false to switch the jobs off, e.g. on extra instances.
 */
@Configuration
public class SchedulingConfig {

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }

    @Configuration
    @EnableScheduling
    @ConditionalOnProperty(name = "notifications.scheduler.enabled", havingValue = "true", matchIfMissing = true)
    static class EnabledScheduling {
    }
}
