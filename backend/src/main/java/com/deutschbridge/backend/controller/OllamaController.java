package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.model.dto.ChatSessionDto;
import com.deutschbridge.backend.model.dto.OllamaChatRequestDto;
import com.deutschbridge.backend.model.dto.OllamaGenerateExampleDto;
import com.deutschbridge.backend.model.dto.ResponseMessageDto;
import com.deutschbridge.backend.model.entity.ChatMessage;
import com.deutschbridge.backend.service.ChatMessageService;
import com.deutschbridge.backend.service.ChatSessionService;
import com.deutschbridge.backend.service.OllamaService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ollama")
public class OllamaController {

    private final OllamaService ollamaService;
    private final ChatSessionService chatSessionService;
    private final ChatMessageService chatMessageService;

    public OllamaController(OllamaService ollamaService, ChatSessionService chatSessionService, ChatMessageService chatMessageService) {
        this.ollamaService = ollamaService;
        this.chatSessionService = chatSessionService;
        this.chatMessageService = chatMessageService;
    }

    @PostMapping("/chat")
    public ResponseMessageDto chat(@RequestBody OllamaChatRequestDto request) {
        return ollamaService.chatWithUser(request);
    }

    @PostMapping("/generate-example")
    public OllamaGenerateExampleDto generateExample(@RequestBody OllamaGenerateExampleDto request) {
        return ollamaService.generateAiExample(request);
    }

    @PostMapping("/generate-synonym")
    public String generateSynonym(@RequestBody OllamaGenerateExampleDto request) {
        return ollamaService.generateAiSynonyms(request.word());
    }

    @GetMapping("/sessions/{userId}")
    public List<ChatSessionDto> getSessions(@PathVariable String userId) {
        return chatSessionService.getByUserId(userId);
    }

    @GetMapping("/message/{sessionId}")
    public List<ChatMessage> getMessages(@PathVariable String sessionId) {
     return chatMessageService.getBySessionId(sessionId);
    }

    @PutMapping("/session-title/{sessionId}")
    public ChatSessionDto updateSessionTitle(@PathVariable String sessionId, @RequestBody ChatSessionDto dto) {
        return chatSessionService.updateTitle(sessionId, dto.title());
    }
}
