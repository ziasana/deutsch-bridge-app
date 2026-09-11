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

    public ExamPassage ensureId() {
        if (this.id == null || this.id.isBlank()) {
            this.id = NanoIdUtils.randomNanoId();
        }
        return this;
    }
}
