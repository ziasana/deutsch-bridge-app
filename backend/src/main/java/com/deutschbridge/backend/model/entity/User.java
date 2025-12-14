package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.LearningLevel;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@EnableJpaAuditing
@Table(name="users")
public class User implements UserDetails {
    @Id
    private String id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "password")
    @Setter
    private String password;

    @Column(nullable = false, unique = true)
    @Setter
    private String username;
    @Getter
    @Setter
    private int tokenValue =0;
    @Getter
    @Setter
    private String refreshToken;
    @Getter
    @Setter
    private String role="USER";
    @Setter
    @Getter
    private String verificationToken;
    @Setter
    @Getter
    private boolean isVerified;
    @Setter
    @Getter
    private String resetToken;

    private LearningLevel learningLevel;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "profile_id")
    private static UserProfile profile;

    @OneToMany(mappedBy = "userId")
    @ToString.Exclude
    private static List<DailyPracticeLog> dailyPracticeLog;

    @OneToMany(mappedBy = "userId", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    private static List<Vocabulary> vocabulary;

    @PrePersist
    public void ensureId() {
        if (this.id == null) {
            this.id = "user-"+ NanoIdUtils.randomNanoId();
        }
    }

    public User(String id, String email, String password, String username, LearningLevel learningLevel) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.username = username;
        this.learningLevel = learningLevel;

    }

    public User(String username, String email, String password, String role) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }


    @Override
    public String getPassword() {
        return this.password;
    }

    @Override
    public String getUsername() {
        return this.username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return UserDetails.super.isAccountNonExpired();
    }

    @Override
    public boolean isAccountNonLocked() {
        return UserDetails.super.isAccountNonLocked();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return UserDetails.super.isCredentialsNonExpired();
    }

    @Override
    public boolean isEnabled() {
        return UserDetails.super.isEnabled();
    }

}
