package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.Expression;
import com.deutschbridge.backend.model.enums.ExpressionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface ExpressionRepository extends JpaRepository<Expression, String> {

    long countByStatus(ExpressionStatus status);

    long countByStatusAndCreatedAtAfter(ExpressionStatus status, LocalDateTime after);
}
