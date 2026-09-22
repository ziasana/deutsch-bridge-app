package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ExpressionQuestionOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExpressionQuestionOptionRepository extends JpaRepository<ExpressionQuestionOption, String> {
}
