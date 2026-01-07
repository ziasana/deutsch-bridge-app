package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.LearningLevel;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity(name = "nomenVerbs")
@NoArgsConstructor
@AllArgsConstructor
@Data
public class NomenVerbConnection {
        @Id
        private String id;
        private String word;
        @Column(columnDefinition = "TEXT")
        private String explanation;
        @Column(columnDefinition = "TEXT")
        private String example;
        @Enumerated(EnumType.STRING)
        private LearningLevel level;
        private String tags;

        @PrePersist
        public void ensureId() {
                if (this.id == null) {
                        this.id = NanoIdUtils.randomNanoId();
                }
        }
}
