package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity(name = "dictionary_example")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Example {
    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonBackReference("sense-examples")
    private Sense sense;

    @Column(columnDefinition = "TEXT")
    private String de;

    @Column(columnDefinition = "TEXT")
    private String en;

    @Column(columnDefinition = "TEXT")
    private String audioUrl;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
    }
}
