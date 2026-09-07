package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A word the user saved from the click-to-define dictionary panel. Deliberately separate from
 * UserWordProgress (the reading-annotation lexicon with SM-2 scheduling) - this tracks saves from
 * DictionaryEntry lookups instead. status is a plain field for now; no scheduling algorithm wired
 * up yet (spec explicitly defers that).
 */
@Entity(name = "user_vocab")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserVocab {
    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    private DictionaryEntry entry;

    private LocalDateTime addedAt;

    /** "new" | "learning" | "known" */
    private String status = "new";

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
        if (this.addedAt == null) {
            this.addedAt = LocalDateTime.now();
        }
    }
}
