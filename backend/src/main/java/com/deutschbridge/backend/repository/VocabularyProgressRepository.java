package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.VocabularyItem;
import com.deutschbridge.backend.model.entity.VocabularyProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VocabularyProgressRepository extends JpaRepository<VocabularyProgress, String> {

    Optional<VocabularyProgress> findByUserAndVocabularyItem(User user, VocabularyItem vocabularyItem);

    List<VocabularyProgress> findByUser(User user);

    List<VocabularyProgress> findByUserAndVocabularyItemIn(User user, List<VocabularyItem> vocabularyItems);
}
