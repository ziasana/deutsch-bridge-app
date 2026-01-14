package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.PreferredLanguage;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity (name = "user_profiles")
@NoArgsConstructor
@AllArgsConstructor
@Data
public class UserProfile{
        @Id
        @Getter
        private String id;

        @OneToOne
        @JoinColumn(name = "user_id")
        @JsonIgnore
        private User user;
        private String displayName;
        @Enumerated(EnumType.STRING)
        private PreferredLanguage preferredLanguage =  PreferredLanguage.EN;
        private Integer dailyGoalWords;
        private Integer dailyGoalTime;
        @Enumerated(EnumType.STRING)
        private LearningLevel learningLevel;
        private boolean notificationsEnabled;

        @PrePersist
        public void ensureId() {
                if (this.id == null) {
                        this.id = NanoIdUtils.randomNanoId();
                }
        }
}
