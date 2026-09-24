package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.AccountType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.Instant;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Data
@EntityListeners(AuditingEntityListener.class)
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
    private String avatarUrl;

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;

    private String role="STUDENT";

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false)
    private AccountType accountType = AccountType.BASIC;

    private int accessTokenFlag = 0;
    private String resetToken;
    private String refreshToken;
    private String verificationToken;
    private boolean isVerified;

    @ColumnDefault("true")
    @Column(nullable = false)
    private boolean enabled = true;

    /** Soft-deleted by an admin: hidden from the admin user list, login blocked, data retained. */
    @ColumnDefault("false")
    @Column(nullable = false)
    private boolean deleted = false;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "id")
    private UserProfile profile;

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
