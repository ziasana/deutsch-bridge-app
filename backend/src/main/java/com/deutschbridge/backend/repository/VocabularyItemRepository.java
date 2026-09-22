package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.DictionaryEntry;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.VocabularyItem;
import com.deutschbridge.backend.model.enums.VocabularySource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VocabularyItemRepository extends JpaRepository<VocabularyItem, String> {

    List<VocabularyItem> findByUser(User user);

    List<VocabularyItem> findByUserOrderByCreatedAtDesc(User user);

    List<VocabularyItem> findTop10ByUserOrderByCreatedAtDesc(User user);

    List<VocabularyItem> findByUserAndSource(User user, VocabularySource source);

    Optional<VocabularyItem> findByUserAndWordIgnoreCaseAndLanguage(User user, String word, String language);

    Optional<VocabularyItem> findByUserAndDictionaryEntry(User user, DictionaryEntry entry);

    boolean existsByUserAndDictionaryEntry(User user, DictionaryEntry entry);
}
