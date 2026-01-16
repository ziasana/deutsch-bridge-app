package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ChatSessionDto;
import com.deutschbridge.backend.model.entity.ChatSession;
import com.deutschbridge.backend.repository.ChatSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatSessionServiceTest {

    @Mock
    ChatSessionRepository chatSessionRepository;
    @Mock
    RequestContext requestContext;

    @InjectMocks
    private ChatSessionService chatSessionService;

    ChatSession chatSession;

    @BeforeEach
    void setup() {
        chatSession = new ChatSession("user1", "assistant");
    }

    // ---------------------------------------------------------------
    // findAll
    // ---------------------------------------------------------------
    @Test
    @DisplayName("findAll -> should return list of sessions")
    void testFindAll_ShouldReturnListOfChatSessions() {

        when(chatSessionRepository.findAll()).thenReturn(List.of(chatSession));

        List<ChatSession> result = chatSessionService.findAll();

        assertNotNull(result);
        assertEquals(chatSession.getId(), result.getFirst().getId());
        verify(chatSessionRepository, times(1)).findAll();
    }


    // ---------------------------------------------------------------
    // save
    // ---------------------------------------------------------------
    @Test
    @DisplayName("save -> should save a new chat session")
    void testSave_ShouldSaveChatSession() {

        chatSessionService.save("user1");
        verify(chatSessionRepository, times(1)).save(any());
    }

    // ---------------------------------------------------------------
    // getByUserId
    // ---------------------------------------------------------------
    @Test
    @DisplayName("find -> should return a chat session by user")
    void testGetByUserId_ShouldReturnChatSession() {

        ChatSessionDto chatSessionDto = new ChatSessionDto("123", "user1", "new chat");
        when(requestContext.getUserId()).thenReturn("user1");
        when(chatSessionRepository.findByUserId("user1")).thenReturn(List.of(chatSessionDto));

        List<ChatSessionDto> result = chatSessionService.getByUserId();
        assertEquals("user1", result.getFirst().userId());
        verify(chatSessionRepository, times(1)).findByUserId(any());

    }

    // ---------------------------------------------------------------
    // getBySessionId
    // ---------------------------------------------------------------
    @Test
    @DisplayName("find -> should return a chat session by id")
    void testGetBySessionId_ShouldReturnChatSession() {
        String sessionId = "session1";
        when(chatSessionRepository.findById(sessionId)).thenReturn(Optional.ofNullable(chatSession));

        ChatSession result = chatSessionService.getBySessionId(sessionId);
        assertEquals("user1", result.getUserId());
        verify(chatSessionRepository, times(1)).findById(any());
    }


    // ---------------------------------------------------------------
    // update
    // ---------------------------------------------------------------
    @Test
    @DisplayName("update -> should update chat title")
    void testUpdate_ShouldUpdateChatSessionTitle() {
        String sessionId = "session1";
        ChatSession newchatSession = new ChatSession();
        newchatSession.setId(sessionId);
        newchatSession.setUserId("user1");
        newchatSession.setTitle("old title");

        when(chatSessionRepository.findById(sessionId))
                .thenReturn(Optional.of(newchatSession));

        when(chatSessionRepository.save(any()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ChatSessionDto result = chatSessionService.updateTitle(sessionId, "second chat");

        assertEquals(sessionId, result.id());
        assertEquals("second chat", result.title());
        verify(chatSessionRepository, times(1)).save(any());
    }

    // ---------------------------------------------------------------
    // delete
    // ---------------------------------------------------------------
    @Test
    @DisplayName("delete -> should delete chat session")
    void testDelete_ShouldDeleteSession() throws DataNotFoundException {
        String sessionId = "session1";

        when(chatSessionRepository.existsById(sessionId))
                .thenReturn(true);

        chatSessionService.delete(sessionId);
        verify(chatSessionRepository, times(1)).deleteById(any());
    }

    @Test
    @DisplayName("delete -> should throw exception")
    void testDelete_ShouldThrowNotFoundException() {
        String sessionId = "session1";

        when(chatSessionRepository.existsById(sessionId))
                .thenReturn(false);

        assertThrows(
                DataNotFoundException.class,
                () -> chatSessionService.delete(sessionId)
        );

        verify(chatSessionRepository, never()).deleteById(anyString());
    }


}