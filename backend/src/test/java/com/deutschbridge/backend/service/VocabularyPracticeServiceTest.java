package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.VocabularyPracticeRequest;
import com.deutschbridge.backend.model.dto.VocabularyResponse;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserVocabularyPractice;
import com.deutschbridge.backend.model.entity.Vocabulary;
import com.deutschbridge.backend.model.entity.VocabularyContent;
import com.deutschbridge.backend.repository.UserVocabularyPracticeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;


@ExtendWith(MockitoExtension.class)
class VocabularyPracticeServiceTest {

    @Mock VocabularyService vocabularyService;
    @Mock UserService userService;
    @Mock UserVocabularyPracticeRepository userVocabularyPracticeRepository;
    @Mock RequestContext requestContext;

    @InjectMocks VocabularyPracticeService vocabularyPracticeService;

    Vocabulary vocabulary;
    User  user;
    VocabularyContent vocabularyContent;
    UserVocabularyPractice userVocabularyPractice;

    @BeforeEach
    void setup() {
        user = new User("john", "john@example.com", "pass");

        vocabulary = new Vocabulary("kaufen", "Ich kaufe ein Auto", null, user);
        vocabularyContent = new VocabularyContent(vocabulary, "to buy something", "EN");
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
    }

    // ---------------------------------------------------------------
    // getUserWithPractice
    // ---------------------------------------------------------------
    @Test
    @DisplayName("getUserWithPractice -> should return list of vocabularies")
    void testGetUserWithPractice_ShouldReturnListOfVocabularies() {
        when(requestContext.getUserEmail()).thenReturn("john@example.com");
        when(requestContext.getUserId()).thenReturn("user1");
        when(requestContext.getLanguage()).thenReturn("EN");

        // Mock existsByEmail to avoid real DB check
        when(userService.existsByEmail(anyString())).thenReturn(true);

        when(vocabularyService.getVocabularyByUserAndLanguage(anyString(), anyString()))
                .thenReturn(List.of(vocabulary));

        List<VocabularyResponse> result = vocabularyPracticeService.getUserWithPractice();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(vocabulary.getWord(), result.get(0).word()); // get(0) instead of getFirst()
        verify(vocabularyService, times(1))
                .getVocabularyByUserAndLanguage(anyString(), anyString());
    }

    // ---------------------------------------------------------------
    // save
    // ---------------------------------------------------------------
    @Test
    @DisplayName("save -> should save vocabulary with practice data")
    void testSave_ShouldSaveVocabularyPractice() throws DataNotFoundException {
        VocabularyPracticeRequest request = new VocabularyPracticeRequest(vocabulary.getId(), true);

        // Stub vocabularyService
        when(vocabularyService.findById(vocabulary.getId())).thenReturn(vocabulary);

        // Stub requestContext
        when(requestContext.getUserId()).thenReturn("user1");
        when(requestContext.getUserEmail()).thenReturn("john@example.com");

        // Stub userService.existsByEmail to avoid UsernameNotFoundException
        when(userService.existsByEmail(anyString())).thenReturn(true);

        vocabularyPracticeService.save(request);

        assertEquals(1, userVocabularyPractice.getKnownCount());
        assertEquals(10, userVocabularyPractice.getSuccessRate());
        verify(userVocabularyPracticeRepository, times(1)).save(any());
    }


    // ---------------------------------------------------------------
    // getVocabularyForPractice
    // ---------------------------------------------------------------
    @Test
    @DisplayName("getVocabularyForPractice -> should return list of vocabularies")
    void testGetVocabularyForPractice_ShouldReturnListOfVocabularies() {
        when(requestContext.getUserEmail()).thenReturn("john@example.com");
        when(requestContext.getUserId()).thenReturn("user1");
        when(requestContext.getLanguage()).thenReturn("EN");
        when(userService.existsByEmail(anyString())).thenReturn(true); // stub it!
        when(vocabularyService.getVocabularyByUserAndLanguage(anyString(), anyString()))
                .thenReturn(List.of(vocabulary));

        List<VocabularyResponse> result = vocabularyPracticeService.getUserWithPractice();

        assertNotNull(result);
        assertEquals(vocabulary.getWord(), result.get(0).word());
        verify(vocabularyService, times(1)).getVocabularyByUserAndLanguage(anyString(), anyString());
    }

}