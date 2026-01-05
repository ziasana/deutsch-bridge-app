package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.Vocabulary;
import com.deutschbridge.backend.model.entity.VocabularyContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface VocabularyContentRepository extends JpaRepository<VocabularyContent, Long> {

    @Query("""
    SELECT vc
    FROM vocabulary_contents vc
    WHERE vc.vocabulary.id = :vocabularyId
      AND vc.language = :language
""")
    VocabularyContent findVocabularyContentByVocabularyIdAndLanguage(@Param("vocabularyId") String vocabularyId, @Param("language")  String language);
    VocabularyContent findVocabularyContentsByVocabulary(Vocabulary vocabulary);
}
