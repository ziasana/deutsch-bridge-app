package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ExpressionQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExpressionQuestionRepository extends JpaRepository<ExpressionQuestion, String> {
}
