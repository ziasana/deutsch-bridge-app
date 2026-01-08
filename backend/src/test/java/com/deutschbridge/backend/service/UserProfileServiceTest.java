package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.UserProfileRequest;
import com.deutschbridge.backend.model.dto.UserProfileResponse;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserProfile;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.UserProfileRepository;
import com.deutschbridge.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(SpringExtension.class)
class UserProfileServiceTest {

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserProfileService userProfileService;

    private UserProfile userProfile;
    private User user;
    @BeforeEach
    void setUp() {
        user = new User();
        userProfile = new UserProfile();
        userProfile.setLearningLevel(LearningLevel.C1);
        userProfile.setNotificationsEnabled(true);
        userProfile.setDailyGoalWords(10);

        user.setDisplayName("John Doe");
        user.setEmail("john@example.com");
        user.setProfile(userProfile);

    }

    // ---------------------------------------------------------------
    // updateUserProfile
    // ---------------------------------------------------------------
    @Test
    @DisplayName("updateUserProfile -> should throw not found")
    void testUpdateUserProfile_notFound() {
        when(userRepository.findById("incorrectId")).thenReturn(java.util.Optional.empty());
        assertThrows(DataNotFoundException.class,
                () -> userProfileService.update("123", any(UserProfileRequest.class)));
        verify(userProfileRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateUserProfile -> should return true and update")
    void testUpdateUserProfile_success() throws DataNotFoundException {
        user.setId("user456");
        when(userRepository.findById("user456")).thenReturn(java.util.Optional.of(user));
        UserProfileRequest request = new UserProfileRequest(
                "Alice",
                "A1",
                10,
                false,
                "EN"
        );
        boolean result = userProfileService.update("user456", request);
        assertTrue(result);
        assertEquals("Alice", user.getDisplayName());
        UserProfile profile = user.getProfile();
        assertNotNull(profile);
        verify(userRepository).save(user);
        verify(userProfileRepository).save(profile);
        verify(userProfileRepository, atMostOnce() ).save(any());
        verify(userProfileRepository, atMostOnce()).save(any());
    }

    // ---------------------------------------------------------------
    // getUserProfileResponse
    // ---------------------------------------------------------------
    @Test
    @DisplayName("getUserProfileResponse -> should return profile response")
    void testGetUserProfileResponse()
    {
        UserProfile profile= user.getProfile();
        UserProfileResponse response= new UserProfileResponse(
                user.getDisplayName(),
                user.getEmail(),
                profile.getLearningLevel().getValue(),
                profile.getDailyGoalWords(),
                profile.isNotificationsEnabled(),
                profile.getPreferredLanguage()

        );

        assertEquals(user.getDisplayName(), response.displayName());
        assertEquals(user.getEmail(), response.email());
        assertEquals(profile.getLearningLevel().getValue(), response.learningLevel());
        assertEquals(profile.getDailyGoalWords(), response.dailyGoalWords());
        assertEquals(profile.isNotificationsEnabled(), response.notificationsEnabled());
    }



}