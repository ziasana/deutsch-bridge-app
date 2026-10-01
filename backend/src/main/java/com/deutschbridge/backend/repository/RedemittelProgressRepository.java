package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.RedemittelProgress;
import com.deutschbridge.backend.model.enums.RedemittelStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface RedemittelProgressRepository extends JpaRepository<RedemittelProgress, String> {

    Optional<RedemittelProgress> findByUserIdAndPhraseId(String userId, String phraseId);

    List<RedemittelProgress> findByUserIdAndPhraseIdIn(String userId, Collection<String> phraseIds);

    long countByUserId(String userId);

    long countByUserIdAndStatus(String userId, RedemittelStatus status);

    long countByUserIdAndLearnedAtAfter(String userId, LocalDateTime since);

    @Query("select count(p) from redemittelProgress p where p.userId = :userId and p.nextReviewAt <= :now")
    long countDue(@Param("userId") String userId, @Param("now") LocalDateTime now);

    @Query("select p from redemittelProgress p where p.userId = :userId and p.nextReviewAt <= :now order by p.nextReviewAt asc")
    List<RedemittelProgress> findDue(@Param("userId") String userId, @Param("now") LocalDateTime now, Pageable pageable);

    List<RedemittelProgress> findByUserIdOrderByLearnedAtDesc(String userId, Pageable pageable);
}
