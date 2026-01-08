package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.model.dto.UserDto;
import com.deutschbridge.backend.model.dto.UserRegistrationRequest;
import com.deutschbridge.backend.model.dto.VocabularyResponse;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserVocabularyPractice;
import com.deutschbridge.backend.model.entity.Vocabulary;
import com.deutschbridge.backend.model.entity.VocabularyContent;
import com.deutschbridge.backend.repository.UserProfileRepository;
import com.deutschbridge.backend.repository.UserRepository;
import com.deutschbridge.backend.repository.VocabularyContentRepository;
import com.deutschbridge.backend.repository.VocabularyRepository;
import com.deutschbridge.backend.util.JWTUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
@ExtendWith(MockitoExtension.class)
class VocabularyServiceTest {

    @Mock private VocabularyRepository vocabularyRepository;
    //@Mock private VocabularyRepository vocabularyRepository;
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
}