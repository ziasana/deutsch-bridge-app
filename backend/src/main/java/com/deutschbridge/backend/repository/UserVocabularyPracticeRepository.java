package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.UserVocabularyPractice;
import com.deutschbridge.backend.model.entity.Vocabulary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserVocabularyPracticeRepository extends JpaRepository<UserVocabularyPractice,String> {

    @Query("""
     SELECT DISTINCT v
    FROM vocabularies v
    JOIN FETCH v.vocabularyContents c
    WHERE v.user.id = :userId
    AND c.language = :language
""")
    List<Vocabulary> findAllWithContentsAndPractices(@Param("userId") String userId, @Param("language") String language);

    Optional<UserVocabularyPractice> findByVocabularyId(String vocabularyId);
}
