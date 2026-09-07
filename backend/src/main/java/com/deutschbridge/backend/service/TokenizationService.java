package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.ArticleTokenItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Ingest-time tokenization for the click-to-define feature (runs once per article, on
 * create/update - never per page view). Tokenizing/splitting is done deterministically in Java;
 * only lemmatization + POS-tagging is delegated to Ollama, batched into a single call per article
 * covering every distinct surface word, since the app has no spaCy/Python NLP service.
 */
@Service
public class TokenizationService {

    private static final Logger log = LoggerFactory.getLogger(TokenizationService.class);
    private static final Pattern TOKEN_PATTERN = Pattern.compile("\\p{L}+|[^\\p{L}]+");
    private static final Pattern WORD_PATTERN = Pattern.compile("\\p{L}+");

    private final OllamaService ollamaService;

    public TokenizationService(OllamaService ollamaService) {
        this.ollamaService = ollamaService;
    }

    public List<ArticleTokenItem> tokenize(String content) {
        if (content == null || content.isBlank()) return new ArrayList<>();

        List<ArticleTokenItem> tokens = splitIntoTokens(content);
        Map<String, String[]> lemmaAndPosBySurface = lookupLemmasAndPos(tokens);

        for (ArticleTokenItem token : tokens) {
            if (!token.isWord()) continue;
            String[] lemmaAndPos = lemmaAndPosBySurface.get(token.getText());
            token.setLemma(lemmaAndPos != null ? lemmaAndPos[0] : token.getText());
            token.setPos(lemmaAndPos != null ? lemmaAndPos[1] : null);
        }

        return tokens;
    }

    private List<ArticleTokenItem> splitIntoTokens(String content) {
        List<ArticleTokenItem> tokens = new ArrayList<>();
        Matcher matcher = TOKEN_PATTERN.matcher(content);
        int index = 0;
        while (matcher.find()) {
            String text = matcher.group();
            boolean isWord = WORD_PATTERN.matcher(text).matches();
            tokens.add(new ArticleTokenItem(index++, text, text, null, isWord));
        }
        return tokens;
    }

    private Map<String, String[]> lookupLemmasAndPos(List<ArticleTokenItem> tokens) {
        Set<String> distinctWords = new LinkedHashSet<>();
        for (ArticleTokenItem token : tokens) {
            if (token.isWord()) distinctWords.add(token.getText());
        }
        if (distinctWords.isEmpty()) return Map.of();

        // Article saves (admin create/update) must never fail just because the AI lemmatizer is
        // down - fall back to identity tokens (lemma = surface form) so the page still renders and
        // words are still clickable; dictionary lookups on inflected forms just won't resolve until
        // the article is re-tokenized once Ollama is available again.
        try {
            String raw = ollamaService.lemmatizeWords(new ArrayList<>(distinctWords));
            return parseLemmaResponse(raw);
        } catch (Exception e) {
            log.warn("Lemmatization via Ollama failed, falling back to identity tokens: {}", e.getMessage());
            return Map.of();
        }
    }

    Map<String, String[]> parseLemmaResponse(String raw) {
        Map<String, String[]> result = new LinkedHashMap<>();
        for (String line : raw.split("\\r?\\n")) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;

            String[] parts = trimmed.split("\\|");
            if (parts.length < 3) continue;

            String surface = parts[0].trim();
            String lemma = parts[1].trim();
            String pos = parts[2].trim().toUpperCase();
            if (surface.isEmpty() || lemma.isEmpty()) continue;

            result.put(surface, new String[]{lemma, pos});
        }
        return result;
    }
}
