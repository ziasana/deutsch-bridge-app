package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.OllamaMessage;
import com.deutschbridge.backend.model.entity.ChatMessage;
import com.deutschbridge.backend.model.entity.ChatSession;
import com.deutschbridge.backend.repository.ChatMessageRepository;
import org.springframework.stereotype.Service;

import java.util.List;
@Service
public class ChatMessageService {
    private final ChatMessageRepository chatMessageRepository;

    public ChatMessageService(ChatMessageRepository chatMessageRepository) {
        this.chatMessageRepository = chatMessageRepository;
    }

    public List<OllamaMessage> allMessage(ChatSession session) {
        return ChatMessageRepository
                .findBySessionIdOrderByTimestampAsc(session.getId())
                .stream()
                .map(m -> new OllamaMessage(m.getRole(), m.getContent()))
                .toList();
    }

    public void save(String sessionId, String userText, String aiAnswer) {
        chatMessageRepository.save(new ChatMessage(sessionId, "user", userText));
        chatMessageRepository.save(new ChatMessage(sessionId, "assistant", aiAnswer));
    }

    public List<ChatMessage>  getBySessionId(String sessionId) {
        return chatMessageRepository.findBySessionId(sessionId);
    }
}
