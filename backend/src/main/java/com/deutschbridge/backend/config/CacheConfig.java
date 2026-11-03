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
                "grammarLessons", "grammarLevelContent", "grammarLessonDetail", "grammarCategoryDetail",
                "grammarLevelSummary", "grammarAdminList", "examExercises", "examAdminList", "writingGuideAdminList", "examLevelSummary", "readingArticles",
                "readingArticleList", "readingArticleDetail", "readingLevelSummary",
                "expressionCollectionSummary", "expressionAdminList", "expressionListPage", "expressionDetail",
                "redemittelPhrase", "redemittelAdminList", "redemittelListPage", "redemittelHubContent", "redemittelExercises", "redemittelFunctionLabels");
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(500)
                .expireAfterWrite(30, TimeUnit.MINUTES));
        // The learners' mock exam overview is cleared by the learner's own exam actions and by every profile, set, exercise or assessment change.
        // The one thing that changes it on its own is time (a running attempt runs out), and the expiry job sweeps those every minute and clears it.
        cacheManager.registerCustomCache("examSimOverview", Caffeine.newBuilder().maximumSize(2000).expireAfterWrite(10, TimeUnit.MINUTES).build());
        // A learner's progress numbers change with every practice result, so these only live for a short while.
        cacheManager.registerCustomCache("progressOverview", Caffeine.newBuilder().maximumSize(2000).expireAfterWrite(30, TimeUnit.SECONDS).build());
        cacheManager.registerCustomCache("progressStats", Caffeine.newBuilder().maximumSize(2000).expireAfterWrite(30, TimeUnit.SECONDS).build());
        return cacheManager;
    }
}
