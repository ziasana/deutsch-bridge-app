package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.Vocabulary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

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
      ORDER BY v.createdAt DESC
""")
   List<Vocabulary> getVocabularyByUserAndLanguage(@Param("userId") String userId, @Param("language") String language);

    @Query("""
    SELECT DISTINCT v
    FROM vocabularies v
    WHERE v.user.id = :userId
      AND v.word = :word
""")
    Vocabulary findByWordAndUser(@Param("userId") String userId, @Param("word") String word);

}
