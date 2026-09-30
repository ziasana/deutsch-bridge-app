package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** An admin-managed reading topic ("Thema") articles can be filed under and students can filter by. */
@Entity(name = "reading_categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReadingCategory {
    @Id
    private String id;
    private String title;
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
        this.createdAt = LocalDateTime.now();
    }
}
