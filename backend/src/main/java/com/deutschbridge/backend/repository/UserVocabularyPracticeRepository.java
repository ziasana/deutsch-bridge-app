package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.UserVocabularyPractice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserVocabularyPracticeRepository extends JpaRepository<UserVocabularyPractice,String> {
    Optional<UserVocabularyPractice> findByVocabularyId(String vocabularyId);
}
