package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** A Redemittel a learner saved to "Meine Redemittel" - a link, not a copy. */
@Entity(name = "redemittelCollection")
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"userId", "phraseId"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RedemittelCollectionItem {
    @Id
    private String id;

    private String userId;
    private String phraseId;
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
        this.createdAt = LocalDateTime.now();
    }
}
