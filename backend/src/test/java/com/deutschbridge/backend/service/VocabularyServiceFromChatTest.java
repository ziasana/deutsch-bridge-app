package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.AiGenerationException;
import com.deutschbridge.backend.exception.FeatureLimitExceededException;
import com.deutschbridge.backend.model.dto.SelectionClassifyResponse;
import com.deutschbridge.backend.model.dto.VocabularyFromChatCreateRequest;
import com.deutschbridge.backend.model.dto.VocabularyItemResponse;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.VocabularyItem;
import com.deutschbridge.backend.repository.DictionaryEntryRepository;
import com.deutschbridge.backend.repository.VocabularyBookmarkRepository;
import com.deutschbridge.backend.repository.VocabularyItemRepository;
import com.deutschbridge.backend.repository.VocabularyProgressRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class VocabularyServiceFromChatTest {

    private final VocabularyItemRepository items = mock(VocabularyItemRepository.class);
    private final UserService users = mock(UserService.class);
    private final RequestContext context = mock(RequestContext.class);
    private final OllamaService ollama = mock(OllamaService.class);
    private final VocabularyService service = new VocabularyService(
            items, mock(VocabularyProgressRepository.class), mock(VocabularyBookmarkRepository.class),
            mock(DictionaryEntryRepository.class), users, context, ollama, new ObjectMapper());

    private void signedIn() throws Exception {
        when(context.getUserEmail()).thenReturn("a@b.c");
        when(context.getLanguage()).thenReturn("EN");
        when(users.findByEmail("a@b.c")).thenReturn(new User());
        when(items.findByUserAndWordIgnoreCaseAndLanguage(any(), anyString(), anyString()))
                .thenReturn(Optional.empty());
        when(items.save(any(VocabularyItem.class))).thenAnswer(i -> i.getArgument(0));
    }

    private static VocabularyFromChatCreateRequest request(String wordType, String synonyms) {
        return new VocabularyFromChatCreateRequest("eine Entscheidung treffen", "to decide", "Ich treffe sie.",
                "chat1", "msg1", null, wordType, synonyms);
    }

    @Test
    @DisplayName("classify returns the word type and synonyms the model gave")
    void classifyParsesWordTypeAndSynonyms() {
        when(ollama.classifySelection(anyString(), anyString())).thenReturn("""
                Hier: {"type":"EXPRESSION","normalizedText":"eine Entscheidung treffen","wordType":"noun-verb-connection",
                "meaning":"to decide","example":"Wir treffen eine Entscheidung.","synonyms":["entscheiden","beschließen"]}""");

        SelectionClassifyResponse r = service.classifySelection("Entscheidung getroffen", "ctx");

        assertEquals("EXPRESSION", r.type());
        assertEquals("NOUN_VERB_CONNECTION", r.wordType());
        assertEquals("entscheiden, beschließen", r.synonyms());
    }

    @Test
    @DisplayName("an expression without a usable word type is still marked as an expression")
    void classifyDefaultsExpressionType() {
        when(ollama.classifySelection(anyString(), anyString())).thenReturn("""
                {"type":"EXPRESSION","normalizedText":"x y","wordType":"???","meaning":"m","example":"e","synonyms":""}""");

        SelectionClassifyResponse r = service.classifySelection("x y", "ctx");

        assertEquals("EXPRESSION", r.wordType());
        assertNull(r.synonyms());
    }

    @Test
    @DisplayName("classify falls back to a heuristic when the model output is not JSON")
    void classifyFallback() {
        when(ollama.classifySelection(anyString(), anyString())).thenThrow(new AiGenerationException("down"));

        SelectionClassifyResponse r = service.classifySelection("auf jeden Fall", "ctx");

        assertEquals("EXPRESSION", r.type());
        assertEquals("EXPRESSION", r.wordType());
    }

    @Test
    @DisplayName("saving keeps the classified word type and synonyms without another AI call")
    void createUsesProvidedValues() throws Exception {
        signedIn();

        VocabularyItemResponse r = service.createFromChat(request("noun_verb_connection", "entscheiden"));

        assertEquals("NOUN_VERB_CONNECTION", r.wordType());
        assertEquals("entscheiden", r.synonyms());
        verify(ollama, never()).generateAiSynonyms(anyString());
    }

    @Test
    @DisplayName("saving still works when the daily synonym allowance is used up")
    void createSurvivesSynonymLimit() throws Exception {
        signedIn();
        when(ollama.generateAiSynonyms(anyString())).thenThrow(new FeatureLimitExceededException("limit"));

        VocabularyItemResponse r = service.createFromChat(request(null, null));

        ArgumentCaptor<VocabularyItem> saved = ArgumentCaptor.forClass(VocabularyItem.class);
        verify(items).save(saved.capture());
        assertEquals("eine entscheidung treffen", saved.getValue().getWord());
        assertNull(r.synonyms());
        assertNull(r.wordType());
    }

    @Test
    @DisplayName("synonyms are generated when classify gave none")
    void createGeneratesMissingSynonyms() throws Exception {
        signedIn();
        when(ollama.generateAiSynonyms(anyString())).thenReturn("beschließen");

        assertEquals("beschließen", service.createFromChat(request("VERB", " ")).synonyms());
    }
}
