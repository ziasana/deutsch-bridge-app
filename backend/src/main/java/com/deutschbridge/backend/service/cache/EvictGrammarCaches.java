package com.deutschbridge.backend.service.cache;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Clears every grammar cache - shared content (lessons, level views, single lesson/category) and
 * the per-user level summaries, whose totals depend on which lessons are published. Put on every
 * admin write to lessons or categories: a category edit changes the level views and category
 * pages, and a lesson edit changes all of them.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Caching(evict = {
        @CacheEvict(cacheNames = "grammarLessons", allEntries = true),
        @CacheEvict(cacheNames = "grammarLevelContent", allEntries = true),
        @CacheEvict(cacheNames = "grammarLessonDetail", allEntries = true),
        @CacheEvict(cacheNames = "grammarCategoryDetail", allEntries = true),
        @CacheEvict(cacheNames = "grammarLevelSummary", allEntries = true)
})
public @interface EvictGrammarCaches {
}
