package com.deutschbridge.backend.util;

import com.deutschbridge.backend.model.dto.VocabularyItemResponse;
import com.deutschbridge.backend.model.dto.VocabularyProgressResponse;
import com.deutschbridge.backend.model.entity.VocabularyItem;
import com.deutschbridge.backend.model.entity.VocabularyProgress;
import com.deutschbridge.backend.model.enums.VocabularyMasteryLevel;

public class VocabularyMapper {
    private VocabularyMapper() {
        throw new IllegalStateException("Mapper Utils class");
    }

    public static VocabularyItemResponse mapToResponse(VocabularyItem item, VocabularyProgress progress, boolean bookmarked) {
        return new VocabularyItemResponse(
                item.getId(),
                item.getSource() != null ? item.getSource().name() : null,
                item.getWord(),
                item.getArticle(),
                item.getMeaning(),
                item.getLanguage(),
                item.getExample(),
                item.getSynonyms(),
                item.getLevel() != null ? item.getLevel().getValue() : null,
                item.getAudioUrl(),
                item.getDictionaryEntry() != null ? item.getDictionaryEntry().getId() : null,
                item.getSourceChatId(),
                item.getSourceMessageId(),
                item.getCreatedAt(),
                progress != null ? mapProgress(progress) : null,
                bookmarked
        );
    }

    public static VocabularyProgressResponse mapProgress(VocabularyProgress p) {
        double overall = overallScore(p);
        return new VocabularyProgressResponse(
                p.getRecallScore(),
                p.getContextScore(),
                overall,
                p.getReviewCount(),
                p.getCorrectCount(),
                p.getIncorrectCount(),
                p.getMasteryLevel() != null ? p.getMasteryLevel().name() : null,
                p.getLastReviewedAt(),
                p.getNextReviewAt()
        );
    }

    /** Recall 60% / Context 40%. */
    public static double overallScore(VocabularyProgress p) {
        return p.getRecallScore() * 0.6 + p.getContextScore() * 0.4;
    }

    public static VocabularyMasteryLevel computeMasteryLevel(VocabularyProgress p) {
        double overall = overallScore(p);
        if (overall >= 80 && p.getReviewCount() >= 5) {
            return VocabularyMasteryLevel.MASTERED;
        }
        if (overall >= 50) {
            return VocabularyMasteryLevel.FAMILIAR;
        }
        if (p.getReviewCount() > 0) {
            return VocabularyMasteryLevel.LEARNING;
        }
        return VocabularyMasteryLevel.NEW;
    }
}
