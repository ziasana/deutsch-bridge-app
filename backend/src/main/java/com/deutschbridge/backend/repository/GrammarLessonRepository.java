package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.GrammarLesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GrammarLessonRepository extends JpaRepository<GrammarLesson, String> {
}
