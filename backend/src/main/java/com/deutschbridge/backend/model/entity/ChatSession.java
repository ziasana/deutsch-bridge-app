package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;

@Entity(name = "chat_sessions")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ChatSession {
    @Id
    private String id;
    private String userId;
    private String title;
    private String mode; // teacher, student, correction
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime lastActivity = LocalDateTime.now();
    @OneToMany(mappedBy = "chatSession", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private Set<ChatMessage> chatMessages;

    public ChatSession(String id)
    {
        this.id = id;
    }

    public ChatSession(String userId, String mode)
    {
        this.userId= userId;
        this.mode= mode;
    }

    @PrePersist
    public void ensureId() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
    }
}
