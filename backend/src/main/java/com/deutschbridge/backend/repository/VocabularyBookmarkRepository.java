package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.VocabularyBookmark;
import com.deutschbridge.backend.model.entity.VocabularyItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface VocabularyBookmarkRepository extends JpaRepository<VocabularyBookmark, String> {

    boolean existsByUserAndVocabularyItem(User user, VocabularyItem vocabularyItem);

    List<VocabularyBookmark> findByUserAndVocabularyItemIn(User user, List<VocabularyItem> vocabularyItems);

    @Transactional
    void deleteByUserAndVocabularyItem(User user, VocabularyItem vocabularyItem);
}
