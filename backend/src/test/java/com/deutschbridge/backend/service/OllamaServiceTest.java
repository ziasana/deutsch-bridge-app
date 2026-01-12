package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.mockito.Mockito.when;
@ExtendWith(MockitoExtension.class)
class OllamaServiceTest {

    @Mock ChatMessageService chatMessageService;
    @Mock ChatSessionService chatSessionService;
    @Mock RequestContext requestContext;
    @Mock UserService userService;

    @InjectMocks OllamaService ollamaService;
    private MockRestServiceServer mockServer;

    @BeforeEach
    void setup() {
        String fakeApiKey = "test-key";
        ollamaService = new OllamaService(
                fakeApiKey,
                chatMessageService,
                chatSessionService,
                requestContext,
                userService
        );

        RestTemplate restTemplate =
                (RestTemplate) ReflectionTestUtils.getField(ollamaService, "restTemplate");

        mockServer = MockRestServiceServer.createServer(restTemplate);

    }

    @Test
    void shouldGenerateAiSynonyms() {
        when(requestContext.getUserEmail()).thenReturn("test@mail.com");
        when(userService.getLearningLevel("test@mail.com")).thenReturn("C1");



        String result = ollamaService.generateAiSynonyms("happy");

        assertThat(result).isEqualTo("happy, joyful, cheerful");
        mockServer.verify();
    }



    // ---------------------------------------------------------------
    // chatWithUser
    // ---------------------------------------------------------------
    @Test
    @DisplayName("chatWithUser -> should return Ai chat response")
    void testChatWithUser_ShouldReturnAiResponse() {


    }

    @Test
    void generateAiExample() {
    }

    @Test
    void generateAiSynonyms() {
    }

    @Test
    void chatWithOllama() {
    }
}