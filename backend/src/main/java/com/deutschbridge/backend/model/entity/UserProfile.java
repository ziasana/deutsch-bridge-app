package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningFocus;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.LearningReason;
import com.deutschbridge.backend.model.enums.PreferredLanguage;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

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

        // Onboarding / learning-plan fields
        @ElementCollection(targetClass = LearningReason.class, fetch = FetchType.EAGER)
        @CollectionTable(name = "user_profile_learning_reasons", joinColumns = @JoinColumn(name = "user_profile_id"))
        @Enumerated(EnumType.STRING)
        @Column(name = "reason")
        private Set<LearningReason> learningReasons = new HashSet<>();

        @ColumnDefault("false")
        private boolean currentLevelUnknown;

        @Enumerated(EnumType.STRING)
        private LearningLevel targetLevel;

        @ElementCollection(targetClass = LearningFocus.class, fetch = FetchType.EAGER)
        @CollectionTable(name = "user_profile_focus_areas", joinColumns = @JoinColumn(name = "user_profile_id"))
        @Enumerated(EnumType.STRING)
        @Column(name = "focus")
        private Set<LearningFocus> focusAreas = new HashSet<>();

        @Enumerated(EnumType.STRING)
        private ExamType examType;

        @Enumerated(EnumType.STRING)
        private LearningLevel examLevel;

        private LocalDate examDate;

        @ColumnDefault("false")
        private boolean onboardingCompleted;

        @PrePersist
        public void ensureId() {
                if (this.id == null) {
                        this.id = NanoIdUtils.randomNanoId();
                }
        }
}
