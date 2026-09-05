package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.Vocabulary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VocabularyRepository extends JpaRepository<Vocabulary,String> {
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
    JOIN FETCH v.vocabularyContents c
    WHERE v.user.id = :userId
      AND c.language = :language
      ORDER BY v.createdAt DESC
      limit 10
""")
    List<Vocabulary> getTop10VocabularyByUserAndLanguage(@Param("userId") String userId, @Param("language") String language);

    @Query(value = """
    SELECT
        SUM(CASE WHEN p.id IS NULL THEN 1 ELSE 0 END) AS beginner,
        SUM(CASE WHEN p.id IS NOT NULL AND p.success_rate = 100 THEN 1 ELSE 0 END) AS master,
        SUM(CASE WHEN p.id IS NOT NULL AND p.success_rate <> 100 THEN 1 ELSE 0 END) AS learning
    FROM vocabularies v
    LEFT JOIN practices p ON p.vocabulary_id = v.id
    JOIN vocabulary_contents c ON c.vocabulary_id = v.id
    WHERE v.user_id = :userId
      AND c.language = :language
""", nativeQuery = true)
    Object[] countVocabularyStatus(@Param("userId") String userId, @Param("language") String language);


    @Query("""
    SELECT DISTINCT v
    FROM vocabularies v
    WHERE v.user.id = :userId
      AND v.word = :word
""")
    Vocabulary findByWordAndUser(@Param("userId") String userId, @Param("word") String word);

}
