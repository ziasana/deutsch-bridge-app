package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.ChatMessage;
import com.deutschbridge.backend.repository.ChatMessageRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChatMessageService {
    private final ChatMessageRepository chatMessageRepository;
    private final ChatSessionService chatSessionService;
    public static final String ROLE_USER = "user";
    public static final String ROLE_ASSISTANT = "assistant";


    public ChatMessageService(ChatMessageRepository chatMessageRepository, ChatSessionService chatSessionService) {
        this.chatMessageRepository = chatMessageRepository;
        this.chatSessionService = chatSessionService;
    }

    public void save(String sessionId, String userText, String aiAnswer) {
        if (sessionId == null) return;
        chatSessionService.findById(sessionId).ifPresent(session -> {
            chatMessageRepository.save(new ChatMessage(session, ROLE_USER, userText));
            chatMessageRepository.save(new ChatMessage(session, ROLE_ASSISTANT, aiAnswer));
        });
    }

    public List<ChatMessage>  getBySessionId(String sessionId) {
        return chatMessageRepository.findChatMessagesByChatSession_Id(sessionId);
    }
}
