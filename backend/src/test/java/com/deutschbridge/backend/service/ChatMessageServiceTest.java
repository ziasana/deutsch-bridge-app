package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.ChatMessage;
import com.deutschbridge.backend.repository.ChatMessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatMessageServiceTest {

    @Mock
    ChatMessageRepository chatMessageRepository;

    @InjectMocks
    private ChatMessageService chatMessageService;

    ChatMessage chatMessage;

    @BeforeEach
    void setup() {
        chatMessage = new ChatMessage("session1", "assistant", "message content");
    }


    // ---------------------------------------------------------------
    // save
    // ---------------------------------------------------------------
    @Test
    @DisplayName("save -> should save user and assistant messages")
    void testSave_ShouldSaveUserAndAssistantMessages() {
        // Given
        String sessionId = "session1";
        String userText = "User question";
        String aiAnswer = "Ai answer";

        chatMessageService.save(sessionId, userText, aiAnswer);

        verify(chatMessageRepository, times(2)).save(any(ChatMessage.class));
    }


    // ---------------------------------------------------------------
    // getBySessionId
    // ---------------------------------------------------------------
    @Test
    @DisplayName("find -> should return a chat message by session id")
    void testGetBySessionId_ShouldReturnChatMessage() {
        String sessionId = "session1";
        when(chatMessageRepository.findBySessionId(sessionId)).thenReturn(Collections.singletonList(chatMessage));

        List<ChatMessage> result = chatMessageService.getBySessionId(sessionId);
        assertEquals(sessionId, result.getFirst().getSessionId());
        verify(chatMessageRepository, times(1)).findBySessionId(any());
    }
}