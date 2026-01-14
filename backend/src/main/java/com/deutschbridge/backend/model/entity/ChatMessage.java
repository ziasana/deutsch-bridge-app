package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity(name = "chat_messages")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatMessage {
    @Id
    private String id;
    private String sessionId;     // Link to ChatSession
    private String role;          // system, user, assistant
    @Column(columnDefinition = "TEXT")
    private String content;
    private LocalDateTime timestamp = LocalDateTime.now();

    public ChatMessage(String sessionId, String role, String content) {
        this.sessionId = sessionId;
        this.role = role;
        this.content = content;
    }

    @PrePersist
    public void ensureId() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
    }
}
