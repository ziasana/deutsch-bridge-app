package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.Vocabulary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VocabularyRepository extends JpaRepository<Vocabulary,String> {
    Vocabulary findByWord(String word);
    Vocabulary getVocabularyById(String id);

    @Query("""
    SELECT DISTINCT v
    FROM vocabularies v
    JOIN FETCH v.vocabularyContents c
    WHERE v.user.id = :userId
      AND c.language = :language
""")
   List<Vocabulary> getVocabularyByUserAndLanguage(@Param("userId") String userId, @Param("language") String language);

    @Query("""
    SELECT vp
    FROM UserVocabularyPractice vp
    JOIN FETCH vp.vocabulary v
    WHERE v.id = :vocabularyId
""")
    List<UserVocabularyPracticeRepository> findByVocabularyId(UUID vocabularyId);

}
