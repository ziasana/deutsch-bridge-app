package com.deutschbridge.backend.model.entity;

import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "chat_sessions")
@Data
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
    private List<String> messageIds = new ArrayList<>();

    public ChatSession(String userId, String mode)
    {
        this.userId= userId;
        this.mode= mode;
    }
}
