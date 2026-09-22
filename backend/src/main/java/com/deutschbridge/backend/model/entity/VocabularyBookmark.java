package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** A user's saved/bookmarked vocabulary item, for quick access via the "Bookmarked" filter. */
@Entity(name = "vocabulary_bookmarks")
@NoArgsConstructor
@AllArgsConstructor
@Data
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "vocabulary_item_id"}))
public class VocabularyBookmark {
    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    private VocabularyItem vocabularyItem;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
        this.createdAt = LocalDateTime.now();
    }
}
