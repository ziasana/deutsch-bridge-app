package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.Vocabulary;
import com.deutschbridge.backend.model.entity.VocabularyContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VocabularyContentRepository extends JpaRepository<VocabularyContent, Long> {
    VocabularyContent findVocabularyContentByVocabularyAndLanguage(Vocabulary vocabulary, String language);
    VocabularyContent findVocabularyContentsByVocabulary(Vocabulary vocabulary);
}
