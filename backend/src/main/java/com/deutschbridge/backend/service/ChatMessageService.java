package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.ChatMessage;
import com.deutschbridge.backend.model.enums.LearningActivityType;
import com.deutschbridge.backend.model.enums.LearningModule;
import com.deutschbridge.backend.repository.ChatMessageRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChatMessageService {
    private final ChatMessageRepository chatMessageRepository;
    private final ChatSessionService chatSessionService;
    private final LearningActivityService learningActivityService;
    public static final String ROLE_USER = "user";
    public static final String ROLE_ASSISTANT = "assistant";


    public ChatMessageService(ChatMessageRepository chatMessageRepository, ChatSessionService chatSessionService,
                               LearningActivityService learningActivityService) {
        this.chatMessageRepository = chatMessageRepository;
        this.chatSessionService = chatSessionService;
        this.learningActivityService = learningActivityService;
    }

    public void save(String sessionId, String userText, String aiAnswer) {
        if (sessionId == null) return;
        chatSessionService.findById(sessionId).ifPresent(session -> {
            chatMessageRepository.save(new ChatMessage(session, ROLE_USER, userText));
            chatMessageRepository.save(new ChatMessage(session, ROLE_ASSISTANT, aiAnswer));
            learningActivityService.track(session.getUserId(), LearningModule.AI_TUTOR, LearningActivityType.AI_TUTOR_MESSAGE, null);
        });
    }

    public List<ChatMessage>  getBySessionId(String sessionId) {
        return chatMessageRepository.findChatMessagesByChatSession_Id(sessionId);
    }
}
