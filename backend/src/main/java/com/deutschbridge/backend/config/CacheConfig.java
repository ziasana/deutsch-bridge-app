package com.deutschbridge.backend.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * In-memory caching for the shared, expensive "static content" fetches (published lessons,
 * exercises, expressions, articles) across the content services. Single backend instance, so
 * Caffeine (in-process) is used instead of a distributed cache like Redis.
 *
 * The TTL below is a safety-net backstop only, not the primary invalidation mechanism: admin
 * write paths evict the relevant cache immediately via @CacheEvict, so content changes are
 * reflected right away rather than waiting out the TTL.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
                "grammarLessons", "grammarCategories", "examExercises", "expressions", "readingArticles");
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(500)
                .expireAfterWrite(30, TimeUnit.MINUTES));
        return cacheManager;
    }
}
