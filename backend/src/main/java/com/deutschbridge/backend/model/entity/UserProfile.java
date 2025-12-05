package com.deutschbridge.backend.model.entity;

import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.PreferredLanguage;
import com.deutschbridge.backend.model.enums.Theme;
import jakarta.persistence.*;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Entity (name = "userProfiles")
@EnableJpaAuditing
public record UserProfile(
        @Id String id,
        @OneToOne
        @JoinColumn(name = "user_id")
        User userId,
        String displayName,
        @Enumerated(EnumType.STRING) PreferredLanguage preferredLanguage,
        Integer dailyGoalWords,
        Integer dailyGoalTime,
        @Enumerated(EnumType.STRING) LearningLevel learningLevel,
        @Enumerated(EnumType.STRING) Theme theme,
        boolean notificationsEnabled

) {
}
