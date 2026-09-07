package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.ArticleTokenItem;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TokenizationServiceTest {

    @Mock
    private OllamaService ollamaService;

    @InjectMocks
    private TokenizationService service;

    // ---------------------------------------------------------------
    // tokenize
    // ---------------------------------------------------------------
    @Test
    @DisplayName("tokenize -> should split words and punctuation into separate tokens that reconstruct the original text")
    void tokenize_shouldSplitWordsAndPunctuation() {
        when(ollamaService.lemmatizeWords(List.of("Hallo", "Welt")))
                .thenReturn("Hallo|Hallo|INTJ\nWelt|Welt|NOUN");

        List<ArticleTokenItem> tokens = service.tokenize("Hallo, Welt!");

        StringBuilder reconstructed = new StringBuilder();
        for (ArticleTokenItem token : tokens) {
            reconstructed.append(token.getText());
        }
        assertEquals("Hallo, Welt!", reconstructed.toString());

        assertTrue(tokens.get(0).isWord());
        assertEquals("Hallo", tokens.get(0).getText());
        assertFalse(tokens.get(1).isWord());
        assertEquals(", ", tokens.get(1).getText());
    }

    @Test
    @DisplayName("tokenize -> should attach lemma and POS from the Ollama response to matching word tokens")
    void tokenize_shouldAttachLemmaAndPos() {
        when(ollamaService.lemmatizeWords(List.of("Häusern")))
                .thenReturn("Häusern|Haus|NOUN");

        List<ArticleTokenItem> tokens = service.tokenize("Häusern");

        assertEquals(1, tokens.size());
        assertEquals("Haus", tokens.get(0).getLemma());
        assertEquals("NOUN", tokens.get(0).getPos());
    }

    @Test
    @DisplayName("tokenize -> should fall back to the surface text as lemma when Ollama omits a word")
    void tokenize_shouldFallBackWhenWordMissingFromResponse() {
        when(ollamaService.lemmatizeWords(List.of("Xyzzy")))
                .thenReturn("");

        List<ArticleTokenItem> tokens = service.tokenize("Xyzzy");

        assertEquals("Xyzzy", tokens.get(0).getLemma());
        assertNull(tokens.get(0).getPos());
    }

    @Test
    @DisplayName("tokenize -> should fall back to identity tokens instead of failing when Ollama throws")
    void tokenize_shouldFallBackWhenOllamaThrows() {
        when(ollamaService.lemmatizeWords(List.of("Haus")))
                .thenThrow(new com.deutschbridge.backend.exception.AiGenerationException("down", new RuntimeException()));

        List<ArticleTokenItem> tokens = service.tokenize("Haus");

        assertEquals(1, tokens.size());
        assertEquals("Haus", tokens.get(0).getLemma());
        assertNull(tokens.get(0).getPos());
    }

    @Test
    @DisplayName("tokenize -> should return an empty list for blank content without calling Ollama")
    void tokenize_shouldReturnEmptyForBlankContent() {
        List<ArticleTokenItem> tokens = service.tokenize("   ");

        assertTrue(tokens.stream().noneMatch(ArticleTokenItem::isWord));
    }

    @Test
    @DisplayName("tokenize -> should dedupe repeated surface words into a single Ollama request")
    void tokenize_shouldDedupeRepeatedWords() {
        when(ollamaService.lemmatizeWords(List.of("Hund", "und")))
                .thenReturn("Hund|Hund|NOUN\nund|und|CONJ");

        List<ArticleTokenItem> tokens = service.tokenize("Hund und Hund");

        long hundCount = tokens.stream().filter(t -> t.getText().equals("Hund")).count();
        assertEquals(2, hundCount);
    }

    // ---------------------------------------------------------------
    // parseLemmaResponse
    // ---------------------------------------------------------------
    @Test
    @DisplayName("parseLemmaResponse -> should skip malformed lines instead of failing")
    void parseLemmaResponse_shouldSkipMalformedLines() {
        Map<String, String[]> result = service.parseLemmaResponse("""
                Häusern|Haus|NOUN
                not-a-valid-line
                lief|laufen|VERB

                """);

        assertEquals(2, result.size());
        assertArrayEquals(new String[]{"Haus", "NOUN"}, result.get("Häusern"));
        assertArrayEquals(new String[]{"laufen", "VERB"}, result.get("lief"));
    }
}
