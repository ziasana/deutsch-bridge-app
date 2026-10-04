package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.Expression;
import com.deutschbridge.backend.model.enums.ExpressionStatus;
import com.deutschbridge.backend.model.enums.ExpressionType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Runs the expression Previous/Next sibling queries against a real PostgreSQL (Testcontainers). */
@Testcontainers
@SpringBootTest(properties = "notifications.scheduler.enabled=false")
@ActiveProfiles("test")
@Transactional
class ExpressionNavigationIntegrationTest {

    private static final Pageable ONE_ROW = PageRequest.of(0, 1);

    @Autowired private ExpressionRepository expressionRepository;

    private Expression expression(String text, ExpressionType type, LearningLevel level, ExpressionStatus status) throws InterruptedException {
        Thread.sleep(5); // createdAt is stamped on persist, so spacing the saves fixes their order
        Expression expression = new Expression();
        expression.setExpression(text);
        expression.setType(type);
        expression.setLevel(level);
        expression.setStatus(status);
        return expressionRepository.save(expression);
    }

    private List<String> next(Expression from) {
        return expressionRepository.findNextInCollection(from.getType(), from.getLevel(), from.getCreatedAt(), from.getId(), ONE_ROW)
                .stream().map(ExpressionNeighborProjection::getExpression).toList();
    }

    private List<String> previous(Expression from) {
        return expressionRepository.findPreviousInCollection(from.getType(), from.getLevel(), from.getCreatedAt(), from.getId(), ONE_ROW)
                .stream().map(ExpressionNeighborProjection::getExpression).toList();
    }

    @Test
    @DisplayName("findNext/PreviousInCollection -> should follow newest-first order within type and level, skipping drafts")
    void navigation_shouldStayInCollectionAndLevelAndSkipDrafts() throws InterruptedException {
        // Seeded content must not become anyone's neighbor here (rolled back with the test transaction).
        expressionRepository.findAll().forEach(e -> e.setStatus(ExpressionStatus.DRAFT));
        expressionRepository.flush();

        // Saved oldest -> newest, so the list (newest first) reads: newest, draftBetween (hidden), middle, oldest.
        Expression oldest = expression("oldest", ExpressionType.REDEWENDUNG, LearningLevel.B1, ExpressionStatus.PUBLISHED);
        expression("other level", ExpressionType.REDEWENDUNG, LearningLevel.C1, ExpressionStatus.PUBLISHED);
        expression("other type", ExpressionType.NOMEN_VERB_VERBINDUNG, LearningLevel.B1, ExpressionStatus.PUBLISHED);
        Expression middle = expression("middle", ExpressionType.REDEWENDUNG, LearningLevel.B1, ExpressionStatus.PUBLISHED);
        expression("draft", ExpressionType.REDEWENDUNG, LearningLevel.B1, ExpressionStatus.DRAFT);
        Expression newest = expression("newest", ExpressionType.REDEWENDUNG, LearningLevel.B1, ExpressionStatus.PUBLISHED);

        // Next = older, previous = newer.
        assertEquals(List.of("middle"), next(newest));
        assertEquals(List.of("oldest"), next(middle));
        assertTrue(next(oldest).isEmpty());

        assertEquals(List.of("middle"), previous(oldest));
        assertEquals(List.of("newest"), previous(middle));
        assertTrue(previous(newest).isEmpty());
    }
}
