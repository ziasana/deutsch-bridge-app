package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.exception.GlobalExceptionHandler;
import com.deutschbridge.backend.model.entity.NomenVerbConnection;
import com.deutschbridge.backend.service.NomenVerbConnectionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@RunWith(SpringRunner.class)
@ActiveProfiles("test")
@Import(GlobalExceptionHandler.class)
@AutoConfigureMockMvc

@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class NomenVerbConnectionControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @Mock
    private NomenVerbConnectionService service;
    @InjectMocks
    private NomenVerbConnectionController nomenVerbConnectionController;

    private NomenVerbConnection nomenVerbConnection;

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(nomenVerbConnectionController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        nomenVerbConnection = new NomenVerbConnection();
        nomenVerbConnection.setId("123");
        nomenVerbConnection.setWord("zur Verfügung stehen");
        nomenVerbConnection.setExplanation("example explanation");
        nomenVerbConnection.setExample("ich stehe Ihnen zur Verfügung");
    }

    // -------------------------------------------------------------------------
    // GET /api/nomen-verb
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("GET /api/nomen-verb -> should return all nomen verb connections")
    void testGetAllNomenVerbConnections_shouldReturnList() throws Exception {
        when(service.findAll()).thenReturn(List.of(nomenVerbConnection));

        mockMvc.perform(get("/api/nomen-verb"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value("123"))
                .andExpect(jsonPath("$[0].word").value("zur Verfügung stehen"));
    }


    // -------------------------------------------------------------------------
    // POST /api/nomen-verb
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("POST /api/nomen-verb -> should save a nomen verb connection")
    void testSave_shouldReturnCreated() throws Exception {
        when(service.save(any(NomenVerbConnection.class))).thenReturn(nomenVerbConnection);

        mockMvc.perform(post("/api/nomen-verb")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                   "word": "Maßnahmen treffen",
                                   "explanation": "Aktive Schritte unternehmen",
                                   "example": "Die Regierung muss dringend Maßnahmen treffen, um die Umweltbelastung zu reduzieren.",
                                   "level": "C1",
                                   "tags": "Politik, Beruf"
                                 }
                      """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("123"))
                .andExpect(jsonPath("$.word").value("zur Verfügung stehen"));
    }

    // -------------------------------------------------------------------------
    // POST /api/nomen-verb
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("POST /api/nomen-verb -> should save a list of nomen verb connections")
    void testSaveBulk_shouldReturnList() throws Exception {
        when(service.saveAll(any())).thenReturn(List.of(nomenVerbConnection));

        mockMvc.perform(post("/api/nomen-verb/bulk")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                [{
                                   "word": "Maßnahmen treffen",
                                   "explanation": "Aktive Schritte unternehmen",
                                   "example": "Die Regierung muss dringend Maßnahmen treffen, um die Umweltbelastung zu reduzieren.",
                                   "level": "C1",
                                   "tags": "Politik, Beruf"
                                 }]
                      """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value("123"));
    }


    // -------------------------------------------------------------------------
    // GET /api/nomen-verb/id
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("GET /api/nomen-verb/id -> should return a nomen verb connection")
    void testGetNomenVerbConnectionById_shouldReturnFound() throws Exception {
        when(service.findById("123")).thenReturn(nomenVerbConnection);

        mockMvc.perform(get("/api/nomen-verb/123"))
                .andExpect(status().isFound())
                .andExpect(jsonPath("$.id").value("123"))
                .andExpect(jsonPath("$.word").value("zur Verfügung stehen"));
    }


    // -------------------------------------------------------------------------
    // UPDATE /api/nomen-verb/id
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("UPDATE /api/nomen-verb/id -> should update a nomen verb connection")
    void testSaveUpdate_shouldReturnUpdated() throws Exception {
        when(service.update(any(), any())).thenReturn(nomenVerbConnection);

        mockMvc.perform(put("/api/nomen-verb/123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                   "word": "Maßnahmen treffen",
                                   "explanation": "Aktive Schritte unternehmen",
                                   "example": "Die Regierung muss dringend Maßnahmen treffen, um die Umweltbelastung zu reduzieren.",
                                   "level": "C1",
                                   "tags": "Politik, Beruf"
                                 }
                      """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("123"))
                .andExpect(jsonPath("$.word").value("zur Verfügung stehen"));
    }


    // -------------------------------------------------------------------------
    // DELETE /api/nomen-verb/id
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("DELETE /api/nomen-verb/id -> should delete a nomen verb connection")
    void testDeleteById_shouldReturnNoContent() throws Exception {
        when(service.deleteById("123")).thenReturn(true);

        mockMvc.perform(delete("/api/nomen-verb/123"))
                .andExpect(status().isNoContent())
                .andExpect(content().string("true"));
    }

    // -------------------------------------------------------------------------
    // GET /api/nomen-verb/id
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("GET /api/nomen-verb/id -> should throw DataNotFound exception")
    void testGetById_shouldThrowDataNotFoundException() throws Exception {
        when(service.findById("999")).thenThrow(new DataNotFoundException("Not found"));

        mockMvc.perform(get("/api/nomen-verb/999"))
                .andExpect(status().isNotFound());
    }
}