package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.WritingPhrase;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.RedemittelStatus;
import com.deutschbridge.backend.model.enums.WritingPhraseCategory;
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

    List<WritingPhrase> findByLevelAndActiveTrueOrderByCategoryAscSortOrderAsc(LearningLevel level);

    boolean existsByLevel(LearningLevel level);

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
              and p.category in :categories
              and (lower(p.phrase) like :search
                   or lower(coalesce(p.explanation, '')) like :search
                   or lower(coalesce(p.meaningEn, '')) like :search
                   or (:matchCategories = true and p.category in :searchCategories))
              and ((pr.id is null and :includeNew = true)
                   or (pr.id is not null and pr.status in :statuses))
              and (:savedOnly = false or exists (
                    select 1 from redemittelCollection c where c.phraseId = p.id and c.userId = :userId))
            order by p.level asc, p.category asc, p.sortOrder asc
            """)
    Page<WritingPhrase> findLearnerPage(@Param("userId") String userId,
                                        @Param("levels") Collection<LearningLevel> levels,
                                        @Param("categories") Collection<WritingPhraseCategory> categories,
                                        @Param("search") String search,
                                        @Param("matchCategories") boolean matchCategories,
                                        @Param("searchCategories") Collection<WritingPhraseCategory> searchCategories,
                                        @Param("includeNew") boolean includeNew,
                                        @Param("statuses") Collection<RedemittelStatus> statuses,
                                        @Param("savedOnly") boolean savedOnly,
                                        Pageable pageable);

    /** Active Redemittel the user has not started learning yet (the pool for "Heute lernen"). */
    @Query("""
            select p from writingPhrases p
            where p.active = true
              and not exists (select 1 from redemittelProgress pr where pr.phraseId = p.id and pr.userId = :userId)
            """)
    List<WritingPhrase> findUnlearned(@Param("userId") String userId);

    @Query("select p.category, count(p) from writingPhrases p where p.active = true group by p.category")
    List<Object[]> countActiveByCategory();
}
