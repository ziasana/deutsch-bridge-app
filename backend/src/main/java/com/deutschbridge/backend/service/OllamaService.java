package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.AiGenerationException;
import com.deutschbridge.backend.model.dto.*;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.PromptType;
import com.deutschbridge.backend.util.PromptLibrary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
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

        boolean isNewSession = requestDto.sessionId() == null
                || chatSessionService.getBySessionId(requestDto.sessionId()) == null;
        String sessionId = resolveSessionId(requestDto.sessionId(), userId);

        String aiAnswer = chatWithOllama(PromptType.CHAT, requestDto.question());

        chatMessageService.save(sessionId, requestDto.question(), aiAnswer);

        String sessionTitle = null;
        if (isNewSession) {
            sessionTitle = generateSessionTitle(requestDto.question());
            if (sessionTitle != null) {
                chatSessionService.updateTitle(sessionId, sessionTitle);
            }
        }

        return new ResponseMessageDto(sessionId, userId, aiAnswer, "", sessionTitle);
    }

    /** Best-effort - a title-generation failure shouldn't break the chat response itself. */
    private String generateSessionTitle(String question) {
        try {
            String rawTitle = chatWithOllama(PromptType.SESSION_TITLE, question);
            String title = rawTitle.strip().replaceAll("^[\"'\\s]+|[\"'\\s.!?]+$", "");
            return title.isBlank() ? null : title;
        } catch (AiGenerationException e) {
            return null;
        }
    }

    public OllamaGenerateExampleDto generateAiExample(OllamaGenerateExampleDto requestDto) {
        String aiAnswer = chatWithOllama(PromptType.EXAMPLE, requestDto.word());
        return new OllamaGenerateExampleDto(cleanUpExampleSentence(aiAnswer));
    }

    /** Strips a leading bullet/number/quote and collapses to a single line, in case the model
     * still returns more than the one requested sentence despite the prompt. */
    private String cleanUpExampleSentence(String raw) {
        String firstLine = raw.strip().split("\\r?\\n", 2)[0];
        return firstLine.replaceAll("^[-*\\d.)\\s\"'„“]+|[\"'„“]+$", "").strip();
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
        return callOllama(messages);
    }

    public String generateReadingArticle(String topic, LearningLevel level) {
        List<OllamaMessage> messages = List.of(
                new OllamaMessage("system", PromptLibrary.generateReadingArticle(topic, level.name())),
                new OllamaMessage("user", topic)
        );
        return callOllama(messages);
    }

    public String extractKeyVocabulary(String content, LearningLevel level) {
        List<OllamaMessage> messages = List.of(
                new OllamaMessage("system", PromptLibrary.extractKeyVocabulary(content, level.name())),
                new OllamaMessage("user", content)
        );
        return callOllama(messages);
    }

    public String generateAnnotations(String content, LearningLevel level) {
        List<OllamaMessage> messages = List.of(
                new OllamaMessage("system", PromptLibrary.generateAnnotations(content, level.name())),
                new OllamaMessage("user", content)
        );
        return callOllama(messages);
    }

    public String generateReadingQuiz(String content, LearningLevel level) {
        List<OllamaMessage> messages = List.of(
                new OllamaMessage("system", PromptLibrary.generateReadingQuiz(content, level.name())),
                new OllamaMessage("user", content)
        );
        return callOllama(messages);
    }

    public String evaluateExpressionProduction(String expression, String meaningDe, LearningLevel level, String userSentence) {
        List<OllamaMessage> messages = List.of(
                new OllamaMessage("system", PromptLibrary.evaluateExpressionProduction(expression, meaningDe, level.name(), userSentence)),
                new OllamaMessage("user", userSentence)
        );
        return callOllama(messages);
    }

    public String evaluateTransformation(String sourceSentence, String expression, String meaningDe, LearningLevel level, String userSentence) {
        List<OllamaMessage> messages = List.of(
                new OllamaMessage("system", PromptLibrary.evaluateTransformation(sourceSentence, expression, meaningDe, level.name(), userSentence)),
                new OllamaMessage("user", userSentence)
        );
        return callOllama(messages);
    }

    public String generateDailyWords(LearningLevel level, int count, boolean includePersian) {
        List<OllamaMessage> messages = List.of(
                new OllamaMessage("system", PromptLibrary.generateDailyWords(level.name(), count, includePersian)),
                new OllamaMessage("user", "Erstelle " + count + " Vokabeln für Niveau " + level.name() + ".")
        );
        return callOllama(messages);
    }

    public String lemmatizeWords(List<String> words) {
        List<OllamaMessage> messages = List.of(
                new OllamaMessage("system", PromptLibrary.lemmatizeWords(words)),
                new OllamaMessage("user", String.join("\n", words))
        );
        return callOllama(messages);
    }

    private String callOllama(List<OllamaMessage> messages) {
        OllamaRequest request = new OllamaRequest(messages);
        HttpEntity<OllamaRequest> entity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<OllamaResponse> response = restTemplate.exchange(
                    OLLAMA_COM_API_CHAT,
                    HttpMethod.POST,
                    entity,
                    OllamaResponse.class
            );
            return extractAiAnswer(response);
        } catch (RestClientException e) {
            throw new AiGenerationException(
                    "AI generation is currently unavailable. Please check the Ollama API key/quota and try again.",
                    e
            );
        }
    }

    private List<OllamaMessage> createChatMessages(PromptType promptType, String question) {
       String learningLevel = String.valueOf(userService.getLearningLevel(requestContext.getUserEmail()));
       String userPrompt= "";
        if(promptType == (PromptType.CHAT)) {
            userPrompt = PromptLibrary.systemPrompt(requestContext.getLanguage());
        }
        if (promptType == PromptType.EXAMPLE) {
            userPrompt = PromptLibrary.generateWordExamples(question, learningLevel);
        }
        if (promptType == PromptType.SYNONYM) {
            userPrompt = PromptLibrary.generateWordSynonyms(question, learningLevel);
        }
        if (promptType == PromptType.SESSION_TITLE) {
            userPrompt = PromptLibrary.generateSessionTitle(requestContext.getLanguage());
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
