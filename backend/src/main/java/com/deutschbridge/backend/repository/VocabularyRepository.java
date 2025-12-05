package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.Vocabulary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VocabularyRepository extends JpaRepository<Vocabulary,String> {
}
