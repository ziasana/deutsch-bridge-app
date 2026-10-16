package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ExamGeneratorTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamGeneratorTopicRepository extends JpaRepository<ExamGeneratorTopic, String> {

    List<ExamGeneratorTopic> findByPartKeyOrderByCreatedAtAsc(String partKey);

    List<ExamGeneratorTopic> findByPartKeyAndKind(String partKey, String kind);

    void deleteByPartKeyAndKind(String partKey, String kind);
}
