package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ChatSessionDto;
import com.deutschbridge.backend.model.entity.ChatSession;
import com.deutschbridge.backend.repository.ChatSessionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ChatSessionService {

    private final ChatSessionRepository chatSessionRepository;
    private final RequestContext requestContext;

    public ChatSessionService(ChatSessionRepository chatSessionRepository, RequestContext requestContext) {
        this.chatSessionRepository = chatSessionRepository;
        this.requestContext = requestContext;
    }

    public List<ChatSession> findAll() {
        return chatSessionRepository.findAll();
    }

    public ChatSession save(String userId) {
        return chatSessionRepository.save(new ChatSession(userId, "teacher"));
    }

    public List<ChatSessionDto> getByUserId() {
        return chatSessionRepository.findByUserId(requestContext.getUserId());
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

    public Optional<ChatSession> findById(String sessionId) {
       return chatSessionRepository.findById(sessionId);
    }

    public void delete(String sessionId) throws DataNotFoundException {
        if (!chatSessionRepository.existsById(sessionId)) {
            throw new DataNotFoundException("Chat Session not found");
        }
        chatSessionRepository.deleteById(sessionId);
    }

}
