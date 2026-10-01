package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.RedemittelExercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;

@Repository
public interface RedemittelExerciseRepository extends JpaRepository<RedemittelExercise, String> {

    List<RedemittelExercise> findByPhraseIdOrderBySortOrderAsc(String phraseId);

    List<RedemittelExercise> findByPhraseIdIn(Collection<String> phraseIds);

    @Transactional
    void deleteByPhraseId(String phraseId);

    @Query("select e.phraseId, count(e) from redemittelExercise e group by e.phraseId")
    List<Object[]> countByPhrase();
}
