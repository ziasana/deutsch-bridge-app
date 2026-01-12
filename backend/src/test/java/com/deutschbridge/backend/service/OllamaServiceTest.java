package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.model.dto.*;
import com.deutschbridge.backend.model.entity.ChatSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.*;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;
import static org.mockito.ArgumentMatchers.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OllamaServiceTest {

    @Mock private ChatMessageService chatMessageService;
    @Mock private ChatSessionService chatSessionService;
    @Mock private RequestContext requestContext;
    @Mock private UserService userService;
    @Mock private RestTemplate restTemplate;

    private OllamaService ollamaService;


    @BeforeEach
    void setUp() {
        ollamaService = new OllamaService(
                "fake-api-key",
                chatMessageService,
                chatSessionService,
                requestContext,
                userService
        );

        // Replace internal RestTemplate with mock
        ReflectionTestUtils.setField(ollamaService, "restTemplate", restTemplate);
    }

    @Test
    @DisplayName("chatWithUser -> should return Ai answer")
    void testChatWithUser_shouldChatWithUserAndSaveMessage() {
        String userId = "user1";
        String question = "Hello LLM!";
        String sessionIdFromRequest = null;
        String resolvedSessionId = "session-123";
        ChatSession fakeSession = new ChatSession(resolvedSessionId);
        when(requestContext.getUserId()).thenReturn(userId);
        when(requestContext.getUserEmail()).thenReturn("test@test.com");
        when(userService.getLearningLevel(any())).thenReturn("C1");

        when(chatSessionService.save(userId)).thenReturn(fakeSession);

        OllamaMessage message = new OllamaMessage("assistant", "Hi there!");
        OllamaResponse response = new OllamaResponse();
        response.setMessage(message);

        ResponseEntity<OllamaResponse> responseEntity =
                new ResponseEntity<>(response, HttpStatus.OK);

        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(OllamaResponse.class)
        )).thenReturn(responseEntity);

        OllamaChatRequestDto requestDto = new OllamaChatRequestDto(sessionIdFromRequest, question);

        ResponseMessageDto result = ollamaService.chatWithUser(requestDto);

        // Check returned DTO
        assertEquals(resolvedSessionId, result.getSessionId());
        assertEquals(userId, result.getUserId());
        assertEquals("Hi there!", result.getContent());

        verify(chatMessageService).save(
                eq(resolvedSessionId),
                eq(question),
                eq("Hi there!")
        );
    }


    @Test
    @DisplayName("generateAiSynonyms -> should return the generated synonyms")
    void testGenerateAiSynonyms_shouldGenerateSynonyms() {
        // given
        when(requestContext.getUserEmail()).thenReturn("test@test.com");
        when(userService.getLearningLevel(any())).thenReturn("C1");

        OllamaMessage message = new OllamaMessage("assistant", "quick, rapid, speedy");
        OllamaResponse response = new OllamaResponse();
        response.setMessage(message);

        ResponseEntity<OllamaResponse> responseEntity =
                new ResponseEntity<>(response, HttpStatus.OK);

        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(OllamaResponse.class)
        )).thenReturn(responseEntity);

        String result = ollamaService.generateAiSynonyms("fast");
        assertEquals("quick, rapid, speedy", result);
    }


    @Test
    @DisplayName("generateAiExample -> should return the generated examples")
    void testGenerateAiExample_shouldGenerateAiExamples() {
        OllamaGenerateExampleDto generateExampleDto = new OllamaGenerateExampleDto("gehen");
        when(requestContext.getUserEmail()).thenReturn("test@test.com");
        when(userService.getLearningLevel(any())).thenReturn("B1");

        OllamaMessage message = new OllamaMessage("assistant", "ich gehe zur Schule");
        OllamaResponse response = new OllamaResponse();
        response.setMessage(message);

        ResponseEntity<OllamaResponse> responseEntity =
                new ResponseEntity<>(response, HttpStatus.OK);

        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(OllamaResponse.class)
        )).thenReturn(responseEntity);

        OllamaGenerateExampleDto result = ollamaService.generateAiExample(generateExampleDto);
        assertEquals("ich gehe zur Schule", result.word());
    }



}