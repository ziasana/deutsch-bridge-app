package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.GlobalExceptionHandler;
import com.deutschbridge.backend.model.dto.ChatSessionDto;
import com.deutschbridge.backend.model.dto.OllamaChatRequestDto;
import com.deutschbridge.backend.model.dto.OllamaGenerateExampleDto;
import com.deutschbridge.backend.model.dto.ResponseMessageDto;
import com.deutschbridge.backend.model.entity.ChatMessage;
import com.deutschbridge.backend.model.entity.ChatSession;
import com.deutschbridge.backend.service.ChatMessageService;
import com.deutschbridge.backend.service.ChatSessionService;
import com.deutschbridge.backend.service.OllamaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.util.List;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@RunWith(SpringRunner.class)
@ActiveProfiles("test")
@Import(GlobalExceptionHandler.class)
@AutoConfigureMockMvc

@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class OllamaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Mock
    private OllamaService ollamaService;
    @Mock
    private ChatSessionService chatSessionService;
    @Mock
    private ChatMessageService chatMessageService;

    @InjectMocks
    OllamaController ollamaController;

    OllamaChatRequestDto ollamaChatRequestDto;
    ResponseMessageDto response;

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(ollamaController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        ollamaChatRequestDto = new OllamaChatRequestDto("session1", "Hello AI");
        response = new ResponseMessageDto("session1", "user1", "Hello human", "assistant");

    }

    // -------------------------------------------------------------------------
    // POST /api/ollama/chat
    // -------------------------------------------------------------------------
    @DisplayName("POST /api/ollama/chat -> should return AI response")
    @Test
    void testChat_ShouldReturnResponseMessage() throws Exception {

        when(ollamaService.chatWithUser(any(OllamaChatRequestDto.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/ollama/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                          {
                                             "user": "1211",
                                             "question": "Hi",
                                             "sessionId" : ""
                                          }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value("session1"))
                .andExpect(jsonPath("$.content").value("Hello human"));

        verify(ollamaService, times(1))
                .chatWithUser(any(OllamaChatRequestDto.class));
    }


    // -------------------------------------------------------------------------
    // POST /api/ollama/generate-example
    // -------------------------------------------------------------------------
    @DisplayName("POST /api/ollama/generate-example -> should return generated AI response")
    @Test
    void testGenerateExample_ShouldReturnResponseMessage() throws Exception {

        OllamaGenerateExampleDto ollamaGenerateExampleDto = new OllamaGenerateExampleDto("to use");
        when(ollamaService.generateAiExample(any(OllamaGenerateExampleDto.class)))
                .thenReturn(ollamaGenerateExampleDto);

        mockMvc.perform(post("/api/ollama/generate-example")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                          {
                                             "word": "nutzen"
                                          }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.word").value(ollamaGenerateExampleDto.word()));

        verify(ollamaService, times(1))
                .generateAiExample(any(OllamaGenerateExampleDto.class));
    }


    // -------------------------------------------------------------------------
    // POST /api/ollama/generate-synonym
    // -------------------------------------------------------------------------
    @DisplayName("POST /api/ollama/generate-synonym -> should return generated AI response")
    @Test
    void testGenerateSynonym_ShouldReturnString() throws Exception {

        when(ollamaService.generateAiSynonyms("fast"))
                .thenReturn("quick, rapid, speedy");

        mockMvc.perform(post("/api/ollama/generate-synonym")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                          {
                                             "word": "fast"
                                          }
                                """))
                .andExpect(status().isOk())
                .andExpect(content().string("quick, rapid, speedy"));

        verify(ollamaService, times(1))
                .generateAiSynonyms("fast");
    }

    // -------------------------------------------------------------------------
    // GET /api/ollama/user-sessions
    // -------------------------------------------------------------------------
    @DisplayName("GET /api/ollama/user-sessions -> should return users sessions")
    @Test
    void testGetSessions_ShouldReturnUsersSessions() throws Exception {

        ChatSessionDto chatSessionDto = new ChatSessionDto("12", "user1", "new chat");
        when(chatSessionService.getByUserId())
                .thenReturn(List.of(chatSessionDto));

        mockMvc.perform(get("/api/ollama/user-sessions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("new chat"));

        verify(chatSessionService, times(1))
                .getByUserId();
    }


    // -------------------------------------------------------------------------
    // GET /api/ollama//message/sessionId
    // -------------------------------------------------------------------------
    @DisplayName("PUT /api/ollama//message/{sessionId} -> should get all message by session id")
    @Test
    void testGetMessages_ShouldReturnUpdatedSession() throws Exception {

        String sessionId = "session1";
        ChatSession session = new ChatSession("user1", "assistant");

        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setId("123");
        chatMessage.setChatSession(session);
        chatMessage.setContent("this is a test message");
        when(chatMessageService.getBySessionId(sessionId))
                .thenReturn(List.of(chatMessage));

        mockMvc.perform(get("/api/ollama/message/{sessionId}", sessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].content").value("this is a test message"));

        verify(chatMessageService, times(1))
                .getBySessionId(anyString());
    }

    // -------------------------------------------------------------------------
    // PUT /api/ollama/session-title/sessionId
    // -------------------------------------------------------------------------
    @DisplayName("PUT /api/ollama/session-title/{sessionId} -> should update chat session title")
    @Test
    void testUpdateSessionTitle_ShouldReturnUpdatedSession() throws Exception {

        String sessionId = "session1";
        String userId = "user1";
        ChatSessionDto responseDto =
                new ChatSessionDto(sessionId, userId, "new title");

        when(chatSessionService.updateTitle((sessionId), ("new title")))
                .thenReturn(responseDto);

        mockMvc.perform(put("/api/ollama/session-title/{sessionId}", sessionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                          {
                                             "sessionId": "session1",
                                             "title": "new title"
                                          }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("session1"))
                .andExpect(jsonPath("$.title").value("new title"));

        verify(chatSessionService, times(1))
                .updateTitle((sessionId), ("new title"));
    }
}