package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.AiGenerationException;
import com.deutschbridge.backend.model.dto.VocabularyCreateRequest;
import com.deutschbridge.backend.model.dto.VocabularyItemResponse;
import com.deutschbridge.backend.model.dto.VocabularyUpdateRequest;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.VocabularyItem;
import com.deutschbridge.backend.model.enums.VocabularyWordType;
import com.deutschbridge.backend.repository.DictionaryEntryRepository;
import com.deutschbridge.backend.repository.VocabularyBookmarkRepository;
import com.deutschbridge.backend.repository.VocabularyItemRepository;
import com.deutschbridge.backend.repository.VocabularyProgressRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class VocabularyServiceWordTypeTest {

    private final VocabularyItemRepository items = mock(VocabularyItemRepository.class);
    private final VocabularyProgressRepository progress = mock(VocabularyProgressRepository.class);
    private final VocabularyBookmarkRepository bookmarks = mock(VocabularyBookmarkRepository.class);
    private final UserService users = mock(UserService.class);
    private final RequestContext context = mock(RequestContext.class);
    private final OllamaService ollama = mock(OllamaService.class);
    private final VocabularyService service = new VocabularyService(
            items, progress, bookmarks, mock(DictionaryEntryRepository.class), users, context, ollama,
            new ObjectMapper());
    private final User user = new User();

    VocabularyServiceWordTypeTest() throws Exception {
        user.setId("u1");
        when(context.getUserEmail()).thenReturn("a@b.c");
        when(context.getLanguage()).thenReturn("EN");
        when(users.findByEmail("a@b.c")).thenReturn(user);
        when(items.findByUserAndWordIgnoreCaseAndLanguage(any(), anyString(), anyString()))
                .thenReturn(Optional.empty());
        when(items.save(any(VocabularyItem.class))).thenAnswer(i -> i.getArgument(0));
        when(ollama.generateAiSynonyms(anyString())).thenReturn("Synonym");
        when(progress.findByUserAndVocabularyItemIn(any(), any())).thenReturn(List.of());
        when(bookmarks.findByUserAndVocabularyItemIn(any(), any())).thenReturn(List.of());
    }

    private static VocabularyCreateRequest create(String word, String article) {
        return new VocabularyCreateRequest(word, article, "meaning", null, null, null);
    }

    private VocabularyItem existing(String word, String article, VocabularyWordType type) {
        VocabularyItem item = new VocabularyItem();
        item.setId("i1");
        item.setUser(user);
        item.setWord(word);
        item.setArticle(article);
        item.setWordType(type);
        item.setSynonyms("old");
        when(items.findById("i1")).thenReturn(Optional.of(item));
        return item;
    }

    @Test
    @DisplayName("parses the type out of a chatty AI answer, longest name first")
    void parsesAiAnswers() {
        assertEquals(VocabularyWordType.VERB, VocabularyWordType.fromAiAnswer("verb."));
        assertEquals(VocabularyWordType.NOUN_VERB_CONNECTION,
                VocabularyWordType.fromAiAnswer("Antwort: NOUN_VERB_CONNECTION (Nomen-Verb-Verbindung)"));
        assertEquals(VocabularyWordType.NOUN_VERB_CONNECTION, VocabularyWordType.fromAiAnswer("noun-verb-connection"));
        assertNull(VocabularyWordType.fromAiAnswer("keine Ahnung"));
        assertNull(VocabularyWordType.fromAiAnswer(null));
    }

    @Test
    @DisplayName("a new word with an article is a noun without asking the AI")
    void articleMeansNoun() {
        VocabularyItemResponse r = service.createCustom(create("Haus", "das"));

        assertEquals("NOUN", r.wordType());
        verify(ollama, never()).classifyWordType(anyString());
    }

    @Test
    @DisplayName("a new word without an article gets its type from the AI, like the synonyms")
    void aiDecidesType() {
        when(ollama.classifyWordType("auf jeden fall")).thenReturn("EXPRESSION");

        VocabularyItemResponse r = service.createCustom(create("auf jeden Fall", null));

        assertEquals("EXPRESSION", r.wordType());
        assertEquals("Synonym", r.synonyms());
    }

    @Test
    @DisplayName("saving still works when the AI cannot classify the word")
    void aiFailureDoesNotBlockSaving() {
        when(ollama.classifyWordType(anyString())).thenThrow(new AiGenerationException("down"));

        VocabularyItemResponse r = service.createCustom(create("laufen", null));

        assertNull(r.wordType());
        assertEquals("laufen", r.word());
    }

    @Test
    @DisplayName("editing to a different word refreshes its type and synonyms")
    void changedWordRefreshes() throws Exception {
        existing("laufen", null, VocabularyWordType.VERB);
        when(ollama.classifyWordType("schnell")).thenReturn("ADJECTIVE");
        when(ollama.generateAiSynonyms("schnell")).thenReturn("rasch");

        VocabularyItemResponse r = service.update("i1",
                new VocabularyUpdateRequest("schnell", null, null, null, null, null));

        assertEquals("ADJECTIVE", r.wordType());
        assertEquals("rasch", r.synonyms());
    }

    @Test
    @DisplayName("editing other fields keeps the type and does not call the AI")
    void unchangedWordKeepsType() throws Exception {
        existing("laufen", null, VocabularyWordType.VERB);

        VocabularyItemResponse r = service.update("i1",
                new VocabularyUpdateRequest(null, null, "to run", null, null, null));

        assertEquals("VERB", r.wordType());
        assertEquals("old", r.synonyms());
        verify(ollama, never()).classifyWordType(anyString());
    }

    @Test
    @DisplayName("an older word without a type gains one the first time it is edited")
    void backfillsOnEdit() throws Exception {
        existing("laufen", null, null);
        when(ollama.classifyWordType("laufen")).thenReturn("VERB");

        VocabularyItemResponse r = service.update("i1",
                new VocabularyUpdateRequest(null, null, "to run", null, null, null));

        assertEquals("VERB", r.wordType());
        assertEquals("old", r.synonyms());
    }
}
