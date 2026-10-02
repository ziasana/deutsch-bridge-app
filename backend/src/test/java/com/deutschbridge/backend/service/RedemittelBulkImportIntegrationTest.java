package com.deutschbridge.backend.service;

import com.deutschbridge.backend.RedemittelTestFunctions;
import com.deutschbridge.backend.model.dto.RedemittelBulkImportResult;
import com.deutschbridge.backend.repository.RedemittelFunctionRepository;
import com.deutschbridge.backend.repository.WritingPhraseRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** Imports the downloadable template end to end (real PostgreSQL, real services). */
@Testcontainers
@org.springframework.transaction.annotation.Transactional
@SpringBootTest(properties = "notifications.scheduler.enabled=false")
@ActiveProfiles("test")
class RedemittelBulkImportIntegrationTest {

    @Autowired private RedemittelBulkImportService service;
    @Autowired private RedemittelFunctionRepository functionRepository;
    @Autowired private WritingPhraseRepository phraseRepository;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private com.deutschbridge.backend.controller.AdminWritingContentController controller;

    @Test
    @DisplayName("the template file imports completely")
    void templateImports() throws Exception {
        functionRepository.save(RedemittelTestFunctions.of("OPINION"));
        functionRepository.save(RedemittelTestFunctions.of("REQUEST"));

        JsonNode root = objectMapper.readTree(Path.of("../frontend/public/templates/redemittel-bulk-import-template.json").toFile());
        List<JsonNode> rows = new ArrayList<>();
        root.forEach(rows::add);

        RedemittelBulkImportResult result = service.bulkImport(rows);
        assertEquals(rows.size(), result.successCount(), result.rows().toString());
    }

    @Test
    @org.springframework.security.test.context.support.WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/admin/writing/phrases/bulk accepts the template")
    void endpoint() throws Exception {
        functionRepository.save(RedemittelTestFunctions.of("OPINION"));
        functionRepository.save(RedemittelTestFunctions.of("REQUEST"));
        String body = java.nio.file.Files.readString(Path.of("../frontend/public/templates/redemittel-bulk-import-template.json"));
        org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup(controller).build().perform(post("/api/admin/writing/phrases/bulk").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.successCount").value(2));
    }
}
