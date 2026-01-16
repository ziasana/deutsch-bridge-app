package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.ChatMessage;
import com.deutschbridge.backend.model.entity.ChatSession;
import com.deutschbridge.backend.repository.ChatMessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Optional;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatMessageServiceTest {

    @Mock
    ChatMessageRepository chatMessageRepository;

    @InjectMocks
    private ChatMessageService chatMessageService;

    @Mock
    ChatSessionService chatSessionService;

    ChatMessage chatMessage;
    ChatSession chatSession;

    @BeforeEach
    void setup() {
        chatSession = new ChatSession("user1", "assistant");
        chatMessage = new ChatMessage(chatSession, "assistant", "message content");
    }


    // ---------------------------------------------------------------
    // save
    // ---------------------------------------------------------------
    @Test
    @DisplayName("save -> should save user and assistant messages")
    void testSave_ShouldSaveUserAndAssistantMessages() {
        // Given
        String userText = "User question";
        String aiAnswer = "Ai answer";
        when(chatSessionService.findById(anyString())).thenReturn(Optional.ofNullable(chatSession));
        chatMessageService.save(String.valueOf(chatSession), userText, aiAnswer);

        verify(chatMessageRepository, times(2)).save(any(ChatMessage.class));
    }


    // ---------------------------------------------------------------
    // getBySessionId
    // ---------------------------------------------------------------
    @Test
    @DisplayName("find -> should return a chat message by session id")
    void testGetBySessionId_ShouldReturnChatMessage() {
        String sessionId = "session1";
        when(chatMessageRepository.findChatMessagesByChatSession_Id(sessionId)).thenReturn(Collections.singletonList(chatMessage));

        chatMessageService.getBySessionId(sessionId);
        verify(chatMessageRepository, times(1)).findChatMessagesByChatSession_Id(any());
    }
}