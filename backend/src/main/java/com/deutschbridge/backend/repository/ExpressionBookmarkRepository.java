package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.Expression;
import com.deutschbridge.backend.model.entity.ExpressionBookmark;
import com.deutschbridge.backend.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ExpressionBookmarkRepository extends JpaRepository<ExpressionBookmark, String> {

    boolean existsByUserAndExpression(User user, Expression expression);

    @Transactional
    void deleteByUserAndExpression(User user, Expression expression);

    List<ExpressionBookmark> findByUserAndExpressionIn(User user, List<Expression> expressions);

    /** Same as {@link #findByUserAndExpressionIn} but by id, for callers that only have light list DTOs. */
    List<ExpressionBookmark> findByUserAndExpression_IdIn(User user, java.util.Collection<String> expressionIds);
}
