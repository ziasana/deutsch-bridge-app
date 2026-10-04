package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.LearningLevel;

import java.time.LocalDateTime;

/** Just the columns the "saved for later" row needs - never an exercise's passages or questions. */
public interface PendingExamBookmarkProjection {
    String getId();
    String getTitle();
    ExamSection getSection();
    LearningLevel getLevel();
    LocalDateTime getBookmarkedAt();
}
