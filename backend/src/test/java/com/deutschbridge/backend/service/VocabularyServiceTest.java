package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.VocabularyRequest;
import com.deutschbridge.backend.model.dto.VocabularyResponse;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserVocabularyPractice;
import com.deutschbridge.backend.model.entity.Vocabulary;
import com.deutschbridge.backend.model.entity.VocabularyContent;
import com.deutschbridge.backend.repository.VocabularyContentRepository;
import com.deutschbridge.backend.repository.VocabularyRepository;
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
import static org.mockito.Mockito.*;
@ExtendWith(MockitoExtension.class)
class VocabularyServiceTest {

    @Mock private VocabularyRepository vocabularyRepository;
    @Mock private RequestContext requestContext;
    @Mock private OllamaService ollamaService;
    @Mock private UserService userService;
    @Mock private VocabularyContentRepository vocabularyContentRepository;

    @InjectMocks
    private VocabularyService vocabularyService;

    Vocabulary vocabulary;
    VocabularyContent vocabularyContent;
    UserVocabularyPractice userVocabularyPractice;
    User user;

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
    // findAll
    // ---------------------------------------------------------------
    @Test
    @DisplayName("findAll -> should return list of vocabularies")
    void testFindAll_ShouldReturnListOfVocabularies() {

        when(vocabularyRepository.findAll()).thenReturn(List.of(vocabulary));

        List<VocabularyResponse> result = vocabularyService.findAll();

        assertNotNull(result);
        assertEquals(vocabulary.getWord(), result.getFirst().word());
        verify(vocabularyRepository, times(1)).findAll();
    }

    // ---------------------------------------------------------------
    // getVocabularyByUserAndLanguage
    // ---------------------------------------------------------------
    @Test
    @DisplayName("getVocabularyByUserAndLanguage -> should return list of vocabularies")
    void testGetVocabularyByUserAndLanguage_ShouldReturnListOfVocabularies() {

        when(vocabularyRepository.getVocabularyByUserAndLanguage(anyString(), anyString())).thenReturn(List.of(vocabulary));

        List<Vocabulary> result = vocabularyService.getVocabularyByUserAndLanguage(anyString(), anyString());

        assertNotNull(result);
        assertEquals(vocabulary.getWord(), result.getFirst().getWord());
        verify(vocabularyRepository, times(1)).getVocabularyByUserAndLanguage(anyString(), anyString());
    }

    // ---------------------------------------------------------------
    // getUserVocabularies
    // ---------------------------------------------------------------
    @Test
    @DisplayName("getUserVocabularies -> should return list of vocabularies for specific user")
    void testGetUserVocabularies_ShouldReturnListOfVocabularies() {

        when(requestContext.getUserEmail()).thenReturn("john@example.com");
        when(requestContext.getUserId()).thenReturn("user1");
        when(requestContext.getLanguage()).thenReturn("EN");
        when(userService.existsByEmail(anyString())).thenReturn(true);

        when(vocabularyRepository.getVocabularyByUserAndLanguage(anyString(), anyString())).thenReturn(List.of(vocabulary));

        List<VocabularyResponse> result = vocabularyService.getUserVocabularies();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(vocabulary.getWord(), result.getFirst().word());
        verify(vocabularyRepository, times(1)).getVocabularyByUserAndLanguage(anyString(), anyString());
    }

    // ---------------------------------------------------------------
    // save
    // ---------------------------------------------------------------
    @Test
    @DisplayName("save -> should save a new vocabulary")
    void testSave_ShouldSaveVocabulary() {

        VocabularyRequest request = new VocabularyRequest(null, "kaufen", "Ich kaufe ein Auto", null, "to buy something");
        when(requestContext.getUserEmail()).thenReturn("john@example.com");
        when(requestContext.getLanguage()).thenReturn("EN");
        when(userService.findByEmail(requestContext.getUserEmail())).thenReturn(user);
        when(ollamaService.generateAiSynonyms(anyString())).thenReturn(anyString());
        when(vocabularyRepository.findByWord(vocabulary.getWord())).thenReturn(null);

        vocabularyService.save(request);
        verify(vocabularyRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("save -> should save on existing vocabulary (vocabulary exists but content not)")
    void testSaveExistingVocabulary_ShouldSaveContentOnly() {

        VocabularyRequest request = new VocabularyRequest(null, "kaufen", "Ich kaufe ein Auto", null, "to buy something");
        vocabulary.setId("voc123");
        when(requestContext.getUserEmail()).thenReturn("john@example.com");
        when(requestContext.getLanguage()).thenReturn("EN");
        when(userService.findByEmail(requestContext.getUserEmail())).thenReturn(user);
        when(ollamaService.generateAiSynonyms(anyString())).thenReturn(anyString());
        when(vocabularyRepository.findByWord(vocabulary.getWord())).thenReturn(vocabulary);
        when(vocabularyContentRepository.findVocabularyContentByVocabularyIdAndLanguage("voc123", "EN"))
                .thenReturn(null);

        vocabularyService.save(request);

        // Verify vocabularyRepository.save is NOT called
        verify(vocabularyRepository, never()).save(any());
        verify(vocabularyContentRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("save -> should throw an exception")
    void testSaveExistingVocabulary_ExistingContent_ShouldThrowException() {

        VocabularyRequest request = new VocabularyRequest(null, "kaufen", "Ich kaufe ein Auto", null, "to buy something");
        vocabulary.setId("voc123");
        when(requestContext.getUserEmail()).thenReturn("john@example.com");
        when(requestContext.getLanguage()).thenReturn("EN");

        when(userService.findByEmail(requestContext.getUserEmail())).thenReturn(user);
        when(ollamaService.generateAiSynonyms(anyString())).thenReturn(anyString());
        when(vocabularyRepository.findByWord(vocabulary.getWord())).thenReturn(vocabulary);
        when(vocabularyContentRepository.findVocabularyContentByVocabularyIdAndLanguage("voc123", "EN"))
                .thenReturn(vocabularyContent);

        assertThrows(IllegalArgumentException.class, () -> vocabularyService.save(request));

        // Verify vocabularyRepository.save is NOT called
        verify(vocabularyRepository, never()).save(any());
        verify(vocabularyContentRepository, never()).save(any());
    }

    // ---------------------------------------------------------------
    // update
    // ---------------------------------------------------------------
    @Test
    @DisplayName("update -> should update vocabulary")
    void testUpdate_ShouldUpdateVocabulary() {

        VocabularyRequest request = new VocabularyRequest("voc123", "kaufen", "Ich kaufe ein Auto", null, "to buy something");

        when(vocabularyRepository.getVocabularyById(request.id())).thenReturn(vocabulary);
        when(requestContext.getLanguage()).thenReturn("EN");
        when(vocabularyContentRepository.findVocabularyContentByVocabularyIdAndLanguage("voc123", "EN"))
                .thenReturn(vocabularyContent);

        VocabularyResponse result= vocabularyService.update(request);
        assertNotNull(result);
        verify(vocabularyRepository, times(1)).save(any());
        verify(vocabularyContentRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("update -> should not update vocabulary (when vocabulary not found)")
    void testUpdate_ShouldDoNoting_WhenVocabularyNotFound() {

        VocabularyRequest request = new VocabularyRequest("voc123", "kaufen", "Ich kaufe ein Auto", null, "to buy something");

        when(vocabularyRepository.getVocabularyById(request.id())).thenReturn(null);

        vocabularyService.update(request);
        verify(vocabularyRepository, never()).save(any());
    }

    // ---------------------------------------------------------------
    // delete
    // ---------------------------------------------------------------
    @Test
    @DisplayName("delete -> should delete vocabulary")
    void testDelete_ShouldDeleteVocabulary() throws DataNotFoundException {

        VocabularyRequest request = new VocabularyRequest("voc123", "kaufen", "Ich kaufe ein Auto", null, "to buy something");

        when(vocabularyRepository.getVocabularyById(request.id())).thenReturn(vocabulary);
        when(requestContext.getLanguage()).thenReturn("EN");
        when(vocabularyContentRepository.findVocabularyContentByVocabularyIdAndLanguage(vocabulary.getId(), "EN"))
                .thenReturn(vocabularyContent);
        when(vocabularyContentRepository.findVocabularyContentsByVocabulary(vocabulary)).thenReturn(null);


        vocabularyService.delete(request);
        verify(vocabularyRepository, times(1)).delete(any());
        verify(vocabularyContentRepository, times(1)).delete(any());
    }

    @Test
    @DisplayName("delete -> should throw DataNotFoundException (when vocabulary not found)")
    void testDelete_ShouldThrowException_WhenVocabularyNotFound()  {

        VocabularyRequest request = new VocabularyRequest("voc123", "kaufen", "Ich kaufe ein Auto", null, "to buy something");

        when(vocabularyRepository.getVocabularyById(request.id())).thenReturn(null);

        assertThrows(DataNotFoundException.class, () -> vocabularyService.delete(request));
        verify(vocabularyRepository, never()).delete(any());
    }

}