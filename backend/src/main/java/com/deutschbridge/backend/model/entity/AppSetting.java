package com.deutschbridge.backend.model.entity;

import jakarta.persistence.*;
import lombok.*;

/** Generic key/value store for admin-configurable application settings (e.g. "premium.enabled"). */
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Data
@Table(name = "app_settings")
public class AppSetting {

    @Id
    @Column(name = "setting_key", unique = true, nullable = false)
    private String key;

    @Column(name = "setting_value", nullable = false)
    private String value;

    private String description;
}
