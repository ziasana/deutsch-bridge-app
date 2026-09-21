package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.AccountType;
import com.deutschbridge.backend.model.enums.FeatureType;
import jakarta.persistence.*;
import lombok.*;

/** Admin-configurable daily usage limit for one (feature, account type) pair. */
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Data
@Table(name = "feature_limits", uniqueConstraints = @UniqueConstraint(columnNames = {"feature_type", "account_type"}))
public class FeatureLimit {

    @Id
    @Column(unique = true, nullable = false)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(name = "feature_type", nullable = false)
    private FeatureType featureType;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false)
    private AccountType accountType;

    @Column(name = "daily_limit", nullable = false)
    private int dailyLimit;

    @Column(nullable = false)
    private boolean enabled = true;

    @PrePersist
    public void ensureId() {
        if (this.id == null) {
            this.id = "feat-limit-" + NanoIdUtils.randomNanoId();
        }
    }
}
