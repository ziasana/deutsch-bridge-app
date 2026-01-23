package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

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

        @OneToMany(mappedBy = "nomenVerb")
        @JsonManagedReference("nomenVerb-progress")
        private Set<LearningProgress> learningProgresses;


        @PrePersist
        public void ensureId() {
                if (this.id == null) {
                        this.id = NanoIdUtils.randomNanoId();
                }
        }
}
