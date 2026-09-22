package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamPassage {
    private String id;
    private String label;

    /** HTML content (rich text: bold/italic/alignment), authored via the admin's rich-text editor. */
    private String content;

    /** Relative URL under /uploads (e.g. "/uploads/exam-passages/xyz.jpg") - null if no image was attached. */
    private String imageUrl;

    /** Relative URL under /uploads (e.g. "/uploads/exam-audio/xyz.m4a") - null for text-only passages. */
    private String audioUrl;

    /**
     * Full transcript of the audio (Hoerverstehen). Server-only - never sent in ExamPassagePublic,
     * so a listening clip's script can't be read before/during an attempt; only revealed via
     * ExamAnswerFeedbackResponse once the related question has been answered.
     */
    private String transcript;

    public ExamPassage ensureId() {
        if (this.id == null || this.id.isBlank()) {
            this.id = NanoIdUtils.randomNanoId();
        }
        return this;
    }
}
