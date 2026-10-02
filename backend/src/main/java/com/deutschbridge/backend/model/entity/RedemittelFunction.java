package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * The communicative function ("Funktion") of a Redemittel, e.g. "Meinung äußern". Admin-managed.
 * The built-in functions keep their former enum names as ids (OPINION, REASON, ...).
 */
@Entity(name = "redemittelFunctions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RedemittelFunction {
    @Id
    private String id;

    @Column(nullable = false)
    private String label;

    private int sortOrder;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
    }
}
