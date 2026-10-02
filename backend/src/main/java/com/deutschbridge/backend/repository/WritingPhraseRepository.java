package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.WritingPhrase;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.RedemittelStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface WritingPhraseRepository extends JpaRepository<WritingPhrase, String> {

    List<WritingPhrase> findByLevelAndActiveTrueOrderByCategorySortOrderAscSortOrderAsc(LearningLevel level);

    boolean existsByLevel(LearningLevel level);

    boolean existsByLevelAndPhraseIgnoreCase(LearningLevel level, String phrase);

    long countByActiveTrue();

    List<WritingPhrase> findByActiveTrue();

    List<WritingPhrase> findByIdInAndActiveTrue(Collection<String> ids);

    /**
     * The learner list: one filtered page of active Redemittel joined with the caller's progress.
     * Collections are always non-empty (callers pass "all values" for an unset filter) so no
     * null/empty parameter handling is needed. A phrase with no progress row counts as NEW.
     */
    @Query("""
            select p from writingPhrases p
            left join redemittelProgress pr on pr.phraseId = p.id and pr.userId = :userId
            where p.active = true
              and p.level in :levels
              and (:allCategories = true or p.category.id = :categoryId)
              and (lower(p.phrase) like :search
                   or lower(coalesce(p.explanation, '')) like :search
                   or lower(coalesce(p.meaningEn, '')) like :search
                   or lower(p.category.label) like :search)
              and ((pr.id is null and :includeNew = true)
                   or (pr.id is not null and pr.status in :statuses))
              and (:savedOnly = false or exists (
                    select 1 from redemittelCollection c where c.phraseId = p.id and c.userId = :userId))
            order by p.level asc, p.category.sortOrder asc, p.category.label asc, p.sortOrder asc
            """)
    Page<WritingPhrase> findLearnerPage(@Param("userId") String userId,
                                        @Param("levels") Collection<LearningLevel> levels,
                                        @Param("allCategories") boolean allCategories,
                                        @Param("categoryId") String categoryId,
                                        @Param("search") String search,
                                        @Param("includeNew") boolean includeNew,
                                        @Param("statuses") Collection<RedemittelStatus> statuses,
                                        @Param("savedOnly") boolean savedOnly,
                                        Pageable pageable);

    /** The learner list without any per-user filter (the cacheable path); same search and order as {@link #findLearnerPage}. */
    @Query("""
            select p from writingPhrases p
            where p.active = true
              and p.level in :levels
              and (:allCategories = true or p.category.id = :categoryId)
              and (lower(p.phrase) like :search
                   or lower(coalesce(p.explanation, '')) like :search
                   or lower(coalesce(p.meaningEn, '')) like :search
                   or lower(p.category.label) like :search)
            order by p.level asc, p.category.sortOrder asc, p.category.label asc, p.sortOrder asc
            """)
    Page<WritingPhrase> findStaticPage(@Param("levels") Collection<LearningLevel> levels,
                                       @Param("allCategories") boolean allCategories,
                                       @Param("categoryId") String categoryId,
                                       @Param("search") String search,
                                       Pageable pageable);

    /** Active Redemittel the user has not started learning yet (the pool for "Heute lernen"). */
    @Query("""
            select p from writingPhrases p
            where p.active = true
              and not exists (select 1 from redemittelProgress pr where pr.phraseId = p.id and pr.userId = :userId)
            """)
    List<WritingPhrase> findUnlearned(@Param("userId") String userId);

    long countByCategoryId(String categoryId);

    @Query("select p.category.id, count(p) from writingPhrases p where p.active = true group by p.category.id")
    List<Object[]> countActiveByCategory();
}
