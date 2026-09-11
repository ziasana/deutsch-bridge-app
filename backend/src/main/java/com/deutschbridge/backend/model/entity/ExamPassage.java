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
    private String content;

    public ExamPassage ensureId() {
        if (this.id == null || this.id.isBlank()) {
            this.id = NanoIdUtils.randomNanoId();
        }
        return this;
    }
}
