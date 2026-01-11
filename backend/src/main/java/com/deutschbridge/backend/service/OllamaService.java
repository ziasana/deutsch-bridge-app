package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.model.dto.*;
import com.deutschbridge.backend.model.enums.PromptType;
import com.deutschbridge.backend.util.PromptLibrary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;

@Service
public class OllamaService {

    private final RestTemplate restTemplate;
    private final HttpHeaders headers;
    private  static final String OLLAMA_COM_API_CHAT = "https://ollama.com/api/chat";

    private final ChatMessageService chatMessageService;
    private final ChatSessionService chatSessionService;
    private final RequestContext requestContext;
    private final UserService userService;

    public OllamaService(
            @Value("${ollama.api.key}") String apiKey,
            ChatMessageService chatMessageService,
            ChatSessionService chatSessionService,
            RequestContext requestContext, UserService userService) {
        this.restTemplate = new RestTemplate();
        this.chatMessageService = chatMessageService;
        this.chatSessionService = chatSessionService;
        headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        this.requestContext = requestContext;
        this.userService = userService;
    }

    public ResponseMessageDto chatWithUser(OllamaChatRequestDto requestDto) {
        String userId = requestContext.getUserId();

        String sessionId = resolveSessionId(requestDto.sessionId(), userId);

        String aiAnswer = chatWithOllama(PromptType.CHAT, requestDto.question());

        chatMessageService.save(sessionId, requestDto.question(), aiAnswer);

        return new ResponseMessageDto(sessionId, userId, aiAnswer, "");
    }

    public OllamaGenerateExampleDto generateAiExample(OllamaGenerateExampleDto requestDto) {

        String aiAnswer = chatWithOllama(PromptType.EXAMPLE,requestDto.word());
        return new OllamaGenerateExampleDto(aiAnswer);
    }

    public String generateAiSynonyms(String word) {
        return chatWithOllama(PromptType.SYNONYM,word);
    }

    private String resolveSessionId(String sessionId, String userId) {
        if (sessionId != null && chatSessionService.getBySessionId(sessionId) != null) {
            return sessionId;
        }
        return chatSessionService.save(userId).getId();
    }

    public String chatWithOllama(PromptType promptType, String question) {
        List<OllamaMessage> messages = createChatMessages(promptType, question);

        OllamaRequest request = new OllamaRequest(messages);
        HttpEntity<OllamaRequest> entity = new HttpEntity<>(request, headers);

        ResponseEntity<OllamaResponse> response = restTemplate.exchange(
                OLLAMA_COM_API_CHAT,
                HttpMethod.POST,
                entity,
                OllamaResponse.class
        );
        return extractAiAnswer(response);
    }

    private List<OllamaMessage> createChatMessages(PromptType promptType, String question) {
       String learningLevel = String.valueOf(userService.getLearningLevel(requestContext.getUserEmail()));
       String userPrompt= "";
        if(promptType == (PromptType.CHAT)) {
            userPrompt = PromptLibrary.systemPrompt();
        }
        if (promptType == PromptType.EXAMPLE) {
            userPrompt = PromptLibrary.generateWordExamples(question, learningLevel);
        }
        if (promptType == PromptType.SYNONYM) {
            userPrompt = PromptLibrary.generateWordSynonyms(question, learningLevel);
        }

        return List.of(
                new OllamaMessage("system", userPrompt),
                new OllamaMessage("user", question)
        );
    }

    private String extractAiAnswer(ResponseEntity<OllamaResponse> response) {
        return Optional.ofNullable(response.getBody())
                .map(OllamaResponse::getMessage)
                .map(OllamaMessage::getContent)
                .orElse("");
    }
}
