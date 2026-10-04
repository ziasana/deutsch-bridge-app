package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExpressionNavigationResponse;
import com.deutschbridge.backend.model.entity.Expression;
import com.deutschbridge.backend.model.entity.ExpressionProgress;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.ExpressionStatus;
import com.deutschbridge.backend.model.enums.ExpressionType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.ExpressionBookmarkRepository;
import com.deutschbridge.backend.repository.ExpressionNeighborProjection;
import com.deutschbridge.backend.repository.ExpressionProgressRepository;
import com.deutschbridge.backend.repository.ExpressionRepository;
import com.deutschbridge.backend.service.cache.ContentCacheService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/** Expression detail-page support: the markViewed race on first view, and the Previous/Next lookup. */
@ExtendWith(MockitoExtension.class)
class ExpressionDetailSupportTest {

    @Mock private ExpressionRepository expressionRepository;
    @Mock private ExpressionProgressRepository expressionProgressRepository;
    @Mock private ExpressionBookmarkRepository expressionBookmarkRepository;
    @Mock private UserService userService;
    @Mock private RequestContext requestContext;
    @Mock private FileStorageService fileStorageService;
    @Mock private ContentCacheService contentCacheService;

    @Test
    @DisplayName("markViewed -> should reuse the row a concurrent request inserted instead of failing on the unique constraint")
    void markViewed_shouldSurviveConcurrentFirstView() throws Exception {
        ExpressionService service = new ExpressionService(expressionRepository, expressionProgressRepository, expressionBookmarkRepository,
                userService, requestContext, fileStorageService, new ObjectMapper(), contentCacheService);
        User user = new User();
        user.setEmail("test@mail.com");
        Expression expression = new Expression();
        expression.setId("e1");
        expression.setStatus(ExpressionStatus.PUBLISHED);
        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);
        when(expressionRepository.findById("e1")).thenReturn(Optional.of(expression));

        ExpressionProgress winner = new ExpressionProgress();
        winner.setUser(user);
        winner.setExpression(expression);
        winner.setRecognitionScore(50);
        // First lookup: nothing yet. After our insert collides, the other request's row is there.
        when(expressionProgressRepository.findByUserAndExpression(user, expression))
                .thenReturn(Optional.empty(), Optional.of(winner));
        when(expressionProgressRepository.save(any(ExpressionProgress.class))).thenThrow(new DataIntegrityViolationException("duplicate"));

        assertDoesNotThrow(() -> service.markViewed("e1"));
    }

    private ExpressionService service() {
        return new ExpressionService(expressionRepository, expressionProgressRepository, expressionBookmarkRepository,
                userService, requestContext, fileStorageService, new ObjectMapper(), contentCacheService);
    }

    private static ExpressionNeighborProjection neighbor(String id, String text) {
        return new ExpressionNeighborProjection() {
            @Override public String getId() { return id; }
            @Override public String getExpression() { return text; }
        };
    }

    @Test
    @DisplayName("findNavigation -> should map the sibling rows, with null where there is no neighbor")
    void findNavigation_shouldMapNeighbors() throws Exception {
        Expression expression = new Expression();
        expression.setId("e1");
        expression.setType(ExpressionType.REDEWENDUNG);
        expression.setLevel(LearningLevel.B1);
        expression.setStatus(ExpressionStatus.PUBLISHED);
        expression.setCreatedAt(LocalDateTime.of(2026, 1, 1, 0, 0));
        when(contentCacheService.getExpressionDetail("e1")).thenReturn(Optional.of(expression));
        when(expressionRepository.findPreviousInCollection(eq(ExpressionType.REDEWENDUNG), eq(LearningLevel.B1), any(), eq("e1"), any()))
                .thenReturn(List.of(neighbor("e0", "Newer")));
        when(expressionRepository.findNextInCollection(eq(ExpressionType.REDEWENDUNG), eq(LearningLevel.B1), any(), eq("e1"), any()))
                .thenReturn(List.of());

        ExpressionNavigationResponse response = service().findNavigation("e1");

        assertEquals("e0", response.previous().id());
        assertEquals("Newer", response.previous().expression());
        assertNull(response.next());
    }

    @Test
    @DisplayName("findNavigation -> should throw DataNotFoundException for a missing or draft expression")
    void findNavigation_shouldRejectDraftOrMissing() {
        Expression draft = new Expression();
        draft.setId("d1");
        draft.setStatus(ExpressionStatus.DRAFT);
        when(contentCacheService.getExpressionDetail("d1")).thenReturn(Optional.of(draft));
        when(contentCacheService.getExpressionDetail("missing")).thenReturn(Optional.empty());

        assertThrows(DataNotFoundException.class, () -> service().findNavigation("d1"));
        assertThrows(DataNotFoundException.class, () -> service().findNavigation("missing"));
    }
}
