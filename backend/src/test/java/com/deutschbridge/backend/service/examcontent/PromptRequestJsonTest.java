package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.model.dto.ExamContentDtos.PromptRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PromptRequestJsonTest {

    @Test
    void deserializesWithAndWithoutIncludeVisuals() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        PromptRequest with = mapper.readValue("{\"exam\":\"TELC\",\"level\":\"B1\",\"section\":\"LESEN\",\"part\":\"TEIL_3\",\"count\":3,\"includeVisuals\":false}", PromptRequest.class);
        assertEquals(Boolean.FALSE, with.includeVisuals());
        assertEquals(3, with.count());
        PromptRequest without = mapper.readValue("{\"exam\":\"TELC\",\"level\":\"B1\",\"section\":\"LESEN\",\"part\":\"TEIL_1\",\"count\":3}", PromptRequest.class);
        assertNull(without.includeVisuals());
    }
}
