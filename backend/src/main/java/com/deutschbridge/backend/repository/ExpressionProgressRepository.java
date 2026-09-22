package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.Expression;
import com.deutschbridge.backend.model.entity.ExpressionProgress;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.ExpressionMasteryLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExpressionProgressRepository extends JpaRepository<ExpressionProgress, String> {

    Optional<ExpressionProgress> findByUserAndExpression(User user, Expression expression);

    List<ExpressionProgress> findByUser(User user);

    List<ExpressionProgress> findByUserAndExpressionIn(User user, List<Expression> expressions);

    long countByUserAndMasteryLevelIn(User user, List<ExpressionMasteryLevel> masteryLevels);
}
