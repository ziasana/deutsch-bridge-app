package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.FeatureType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/** Per-user, per-day usage counter for a gated AI feature. */
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Data
@Table(name = "feature_usages", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "feature_type", "usage_date"}))
public class FeatureUsage {

    @Id
    @Column(unique = true, nullable = false)
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "feature_type", nullable = false)
    private FeatureType featureType;

    @Column(name = "usage_date", nullable = false)
    private LocalDate usageDate;

    @Column(nullable = false)
    private int count;

    @PrePersist
    public void ensureId() {
        if (this.id == null) {
            this.id = "feat-usage-" + NanoIdUtils.randomNanoId();
        }
    }
}
