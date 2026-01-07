package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.ChatSessionDto;
import com.deutschbridge.backend.model.entity.ChatSession;
import com.deutschbridge.backend.repository.ChatSessionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
@Service
public class ChatSessionService {

    private final ChatSessionRepository chatSessionRepository;

    public ChatSessionService(ChatSessionRepository chatSessionRepository) {
        this.chatSessionRepository = chatSessionRepository;
    }

    public List<ChatSession> findAll() {
        return chatSessionRepository.findAll();
    }

    public ChatSession save(String userId) {
        return chatSessionRepository.save(new ChatSession(userId, "teacher"));
    }

    public List<ChatSessionDto> getByUserId(String userId) {
        return chatSessionRepository.findByUserId(userId);
    }

    public ChatSession getBySessionId(String sessionId) {
        return chatSessionRepository.findById(sessionId).orElse(null);
    }

    public ChatSessionDto updateTitle(String sessionId, String title) {
        ChatSession chatSession = getBySessionId(sessionId);
        chatSession.setTitle(title);
        ChatSession updatedSession= chatSessionRepository.save(chatSession);
        return new ChatSessionDto(updatedSession.getId(), updatedSession.getUserId(), updatedSession.getTitle());
    }
}
