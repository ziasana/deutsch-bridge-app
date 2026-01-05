package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.LearningLevel;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import java.util.List;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@EnableJpaAuditing
@Data
@Table(name="users")
public class User {
    @Id
    @Column(unique = true, nullable = false)
    private String id;

    @Column(unique = true, nullable = false)
    private String email;
    private String username;
    private String password;
    private String displayName;

    private String role="STUDENT";
    @Enumerated(EnumType.STRING)
    private LearningLevel learningLevel;
    private int accessTokenFlag = 0;
    private String resetToken;
    private String refreshToken;
    private String verificationToken;
    private boolean isVerified;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "id")
    private UserProfile profile;


    @OneToMany(mappedBy = "userId", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @ToString.Exclude
    private static List<DailyPracticeLog> dailyPracticeLog;

    @OneToMany(mappedBy = "userId", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @ToString.Exclude
    private static List<Vocabulary> vocabulary;

    @PrePersist
    public void ensureId() {
        if (this.id == null) {
            this.id = "user-"+ NanoIdUtils.randomNanoId();
        }
    }

    public User(String displayName, String email, String password) {
        this.displayName = displayName;
        this.email = email;
        this.password = password;
    }

}
