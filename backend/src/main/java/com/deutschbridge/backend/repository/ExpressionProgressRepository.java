package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.Expression;
import com.deutschbridge.backend.model.entity.ExpressionProgress;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.ExpressionMasteryLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExpressionProgressRepository extends JpaRepository<ExpressionProgress, String> {

    Optional<ExpressionProgress> findByUserAndExpression(User user, Expression expression);

    List<ExpressionProgress> findByUser(User user);

    List<ExpressionProgress> findByUserAndExpressionIn(User user, List<Expression> expressions);

    /** Same as {@link #findByUserAndExpressionIn} but by id, for callers that only have light list DTOs. */
    List<ExpressionProgress> findByUserAndExpression_IdIn(User user, java.util.Collection<String> expressionIds);

    long countByUserAndMasteryLevelIn(User user, List<ExpressionMasteryLevel> masteryLevels);

    @Query("SELECT COUNT(p) FROM expression_progress p WHERE p.user = :user " +
            "AND p.masteryLevel <> com.deutschbridge.backend.model.enums.ExpressionMasteryLevel.MASTERED " +
            "AND (p.nextReviewAt IS NULL OR p.nextReviewAt <= :now)")
    long countDueForReview(@Param("user") User user, @Param("now") LocalDateTime now);
}
