package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.GlobalExceptionHandler;
import com.deutschbridge.backend.model.AuthUser;
import com.deutschbridge.backend.model.dto.UserVocabularyPracticeDTO;
import com.deutschbridge.backend.model.dto.VocabularyContentResponse;
import com.deutschbridge.backend.model.dto.VocabularyRequest;
import com.deutschbridge.backend.model.dto.VocabularyResponse;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserVocabularyPractice;
import com.deutschbridge.backend.model.entity.Vocabulary;
import com.deutschbridge.backend.model.entity.VocabularyContent;
import com.deutschbridge.backend.service.VocabularyService;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@SpringBootTest
@RunWith(SpringRunner.class)
@ActiveProfiles("test")
@Import(GlobalExceptionHandler.class)
@AutoConfigureMockMvc

@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)

class VocabularyControllerTest {

    @Autowired private MockMvc mockMvc;

    @Mock
    private VocabularyService vocabularyService;


    @InjectMocks
    private VocabularyController vocabularyController;

    private Vocabulary vocabulary;
    private  User user;
    private UserVocabularyPractice userVocabularyPractice;
    private VocabularyResponse vocabularyResponse;
    private UserVocabularyPracticeDTO userVocabularyPracticeDTO;

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(vocabularyController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        user = new User("john", "john@example.com", "pass");

        vocabulary = new Vocabulary("kaufen", "Ich kaufe ein Auto", null, user);
        VocabularyContent vocabularyContent = new VocabularyContent(vocabulary, "to buy something", "EN");
        Set<VocabularyContent> contents = new HashSet<>();
        contents.add(vocabularyContent);
        vocabulary.setVocabularyContents(contents);

        userVocabularyPractice = new UserVocabularyPractice();
        userVocabularyPractice.setUserId(user.getId());
        userVocabularyPractice.setVocabulary(vocabulary);
        userVocabularyPractice.setUnknownCount(2);
        userVocabularyPractice.setKnownCount(1);
        userVocabularyPractice.setSuccessRate(10);
        Set<UserVocabularyPractice> practices = new HashSet<>();
        practices.add(userVocabularyPractice);
        vocabulary.setPractices(practices);

        userVocabularyPracticeDTO = new UserVocabularyPracticeDTO("12", 50, LocalDate.now());
        VocabularyContentResponse vocabularyContentResponse = new VocabularyContentResponse("to buy something", "EN");

        vocabularyResponse = new VocabularyResponse("voc1","kaufen", "Ich kaufe ein Buch", "synonym"
                ,"user@example.com", List.of(vocabularyContentResponse), List.of(userVocabularyPracticeDTO));
   }

    void setupAuthentication() {
        User userEntity = new User("id123", "john@example.com", "hashedpassword");
        AuthUser authUser = new AuthUser(userEntity);
        authUser.setId("user123");

        Authentication auth = new UsernamePasswordAuthenticationToken(
                authUser,
                null,
                authUser.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }


    // -------------------------------------------------------------------------
    // GET /api/vocabulary
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("GET /api/vocabulary -> should return list of vocabularies")
    void testGetAllVocabularies() throws Exception {

        when(vocabularyService.findAll()).thenReturn(List.of(vocabularyResponse));

        mockMvc.perform(get("/api/vocabulary"))
        .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].word").value("kaufen"));
    }

    // -------------------------------------------------------------------------
    // GET /api/vocabulary/get-user
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("GET /api/vocabulary/get-user -> should return list of vocabularies")
    void testGetUserVocabularies() throws Exception {

        when(vocabularyService.getUserVocabularies()).thenReturn(List.of(vocabularyResponse));

        mockMvc.perform(get("/api/vocabulary/get-user"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].word").value("kaufen"));
    }

    // -------------------------------------------------------------------------
    // POST /api/vocabulary
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("POST /api/vocabulary -> should save a vocabulary")
    void testSaveVocabulary_ShouldReturnCreated() throws Exception {

        // service method returns void → doNothing()
        doNothing().when(vocabularyService).save(any(VocabularyRequest.class));

        mockMvc.perform(post("/api/vocabulary")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(""" 
{
            "word": "kaufen",
            "meaning": "to buy something",
            "example": "Ich kaufe ein Buch",
            "synonyms": "Sorgen",
            "language": "EN",
            "userEmail": "example@gmail.com"}
"""))

                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Vocabulary saved"));

        verify(vocabularyService, times(1)).save(any(VocabularyRequest.class));
    }


    // -------------------------------------------------------------------------
    // PUT /api/vocabulary
    // -------------------------------------------------------------------------
    @DisplayName("PUT /api/vocabulary -> should update vocabulary")
    @Test
    void testUpdateVocabulary_ShouldReturnUpdatedVocabulary() throws Exception {

        when(vocabularyService.update(any(VocabularyRequest.class)))
                .thenReturn(vocabularyResponse);

        mockMvc.perform(put("/api/vocabulary")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(""" 
{
            "word": "kaufen",
            "meaning": "to buy something",
            "example": "Ich kaufe ein Buch",
            "synonyms": "Sorgen",
            "language": "EN",
            "userEmail": "example@gmail.com"
            }
"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Vocabulary updated"))
                .andExpect(jsonPath("$.data.word").value("kaufen"))
                .andExpect(jsonPath("$.data.example").value("Ich kaufe ein Buch"));

        // Verify service interaction
        verify(vocabularyService, times(1))
                .update(any(VocabularyRequest.class));
    }


    // -------------------------------------------------------------------------
    // DELETE /api/vocabulary
    // -------------------------------------------------------------------------
    @DisplayName("DELETE /api/vocabulary -> should delete vocabulary")
    @Test
    void testDeleteVocabulary_ShouldReturnOk() throws Exception {

        doNothing().when(vocabularyService).delete(any(VocabularyRequest.class));

        mockMvc.perform(delete("/api/vocabulary")
                        .contentType(MediaType.APPLICATION_JSON)
                .content("""
                              {
                                     "word": "laufen",
                                     "language": "en",
                                     "userEmail": "zs.hossainy@gmail.com"
                                 }
                      """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Vocabulary deleted"));

        verify(vocabularyService, times(1))
                .delete(any(VocabularyRequest.class));
    }
}