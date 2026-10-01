package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.WritingPhrase;
import com.deutschbridge.backend.model.enums.LearningLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WritingPhraseRepository extends JpaRepository<WritingPhrase, String> {

    List<WritingPhrase> findByLevelAndActiveTrueOrderByCategoryAscSortOrderAsc(LearningLevel level);

    boolean existsByLevel(LearningLevel level);
}
