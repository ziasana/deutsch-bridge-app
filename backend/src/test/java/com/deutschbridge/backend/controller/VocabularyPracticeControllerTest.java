package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.exception.GlobalExceptionHandler;
import com.deutschbridge.backend.model.dto.*;
import com.deutschbridge.backend.service.VocabularyPracticeService;
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
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

@SpringBootTest
@RunWith(SpringRunner.class)
@ActiveProfiles("test")
@Import(GlobalExceptionHandler.class)
@AutoConfigureMockMvc

@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class VocabularyPracticeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Mock
    private VocabularyPracticeService vocabularyPracticeService;

    @Mock private RequestContext requestContext;

    @InjectMocks
    private VocabularyPracticeController vocabularyPracticeController;

    VocabularyResponse vocabularyResponse;
    UserVocabularyPracticeDTO userVocabularyPracticeDTO;
    VocabularyContentResponse vocabularyContentResponse;

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(vocabularyPracticeController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        userVocabularyPracticeDTO = new UserVocabularyPracticeDTO("12", 50, LocalDate.now());
        vocabularyContentResponse = new VocabularyContentResponse("to buy something", "EN");

        vocabularyResponse = new VocabularyResponse("voc1", "kaufen", "Ich kaufe ein Buch", "synonym"
                , "user@example.com", List.of(vocabularyContentResponse), List.of(userVocabularyPracticeDTO));

    }

    // -------------------------------------------------------------------------
    // GET /api/vocabulary-practice
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("GET /api/vocabulary-practice -> should return list of vocabulary practices")
    void testGetUserVocabularyPractice() throws Exception {

        when(vocabularyPracticeService.getUserWithPractice()).thenReturn(List.of(vocabularyResponse));

        mockMvc.perform(get("/api/vocabulary-practice"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].word").value("kaufen"));
    }


    // -------------------------------------------------------------------------
    // GET /api/vocabulary-practice/for-practice
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("GET /api/vocabulary-practice/for-practice -> should return list of vocabulary practices")
    void testGetVocabularyForPractice() throws Exception {

        VocabularyPracticeResponse vocabularyPracticeResponse = new VocabularyPracticeResponse(
                "vocab1", "kaufen", "ich kaufe", "sorgen", Optional.of("to buy something"));
        when(vocabularyPracticeService.getVocabularyForPractice()).thenReturn(List.of(vocabularyPracticeResponse));

        mockMvc.perform(get("/api/vocabulary-practice/for-practice"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].word").value("kaufen"));
    }


    // -------------------------------------------------------------------------
    // POST /api/vocabulary-practice
    // -------------------------------------------------------------------------
    @DisplayName("save -> should update existing practice")
    @Test
    void testSaveVocabularyPractice_ShouldReturnCreated() throws Exception {

        doNothing().when(vocabularyPracticeService)
                .save(any(VocabularyPracticeRequest.class));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vocabulary-practice")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(""" 
                                {
                                            "vocabularyId": "vocab1",
                                            "known": true
                                            }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message")
                        .value("Vocabulary practice saved"));

        verify(vocabularyPracticeService, times(1))
                .save(any(VocabularyPracticeRequest.class));
    }

    @DisplayName("POST /api/vocabulary-practice -> should return 404 when vocabulary not found")
    @Test
    void testSaveVocabularyPractice_ShouldReturnNotFound() throws Exception {

        doThrow(new DataNotFoundException("Not found"))
                .when(vocabularyPracticeService)
                .save(any());

        mockMvc.perform(post("/api/vocabulary-practice")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(""" 
                                {
                                            "vocabularyId": "vocab1",
                                            "known": true
                                            }
                                """))
                .andExpect(status().isNotFound());
    }

}