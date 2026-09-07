package com.deutschbridge.backend.model.entity;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ArticleTokenItemTest {

    /**
     * Regression test: Jackson's default JavaBean naming strips the "is" prefix from a boolean
     * isXxx() getter, so without @JsonProperty this would serialize as "word" instead of "isWord" -
     * silently breaking the frontend's ArticleToken.isWord field.
     */
    @Test
    @DisplayName("serialization -> should serialize the boolean field as \"isWord\", not \"word\"")
    void shouldSerializeAsIsWord() throws Exception {
        ArticleTokenItem token = new ArticleTokenItem(0, "Haus", "Haus", "NOUN", true);

        String json = new ObjectMapper().writeValueAsString(token);

        assertTrue(json.contains("\"isWord\":true"), "expected \"isWord\":true in: " + json);
        assertEquals(-1, json.indexOf("\"word\":"), "should not serialize a bare \"word\" field: " + json);
    }
}
