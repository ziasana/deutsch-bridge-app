package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.LearningLevel;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EnableJpaAuditing
public class User {
    @Id
    private String id;
    @Column(unique = true, nullable = false)
    private String email;
    private String passwordHash;
    @Column(nullable = false, unique = true)
    private String username;
    private LearningLevel learningLevel;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "profile_id")
    private UserProfile profile;

    @OneToMany(mappedBy = "userId")
    private List<DailyPracticeLog> dailyPracticeLog;

    @OneToMany(mappedBy = "userId", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Vocabulary> vocabulary;

    @PrePersist
    public void ensureId() {
        if (this.id == null) {
            this.id = "user-"+ NanoIdUtils.randomNanoId();
        }
    }

    public User(String id, String email, String passwordHash, String username, LearningLevel learningLevel) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.username = username;
        this.learningLevel = learningLevel;

    }
}
