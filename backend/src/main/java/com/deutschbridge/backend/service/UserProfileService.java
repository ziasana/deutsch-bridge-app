package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.UserProfileRequest;
import com.deutschbridge.backend.model.dto.UserProfileResponse;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserProfile;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.PreferredLanguage;
import com.deutschbridge.backend.repository.UserProfileRepository;
import com.deutschbridge.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;

    public UserProfileService(UserProfileRepository userProfileRepository, UserRepository userRepository) {
        this.userProfileRepository = userProfileRepository;
        this.userRepository = userRepository;
    }

    public UserProfile save(UserProfileResponse userProfileResponse) {
        User user = userRepository.findByEmail(userProfileResponse.email())
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserProfile profile = new UserProfile(
                UUID.randomUUID().toString(),
                user,
                user.getDisplayName(),
                PreferredLanguage.EN,
                userProfileResponse.dailyGoalWords(),
                30,
                LearningLevel.B1,
                true
        );

        return userProfileRepository.save(profile);
    }


    public void update(String userId, UserProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserProfile profile= user.getProfile();
        if(profile == null) {
            profile = new UserProfile();
            profile.setDisplayName(request.displayName());
            profile.setLearningLevel(LearningLevel.valueOf( request.learningLevel()));
            profile.setDailyGoalWords(request.dailyGoalWords());
            profile.setNotificationsEnabled(request.notificationsEnabled());

            // 🔑 THIS IS THE KEY PART
            profile.setUser(user);
            user.setProfile(profile);
            userProfileRepository.save(profile);

        }else {
            if (request.displayName() != null) profile.setDisplayName(request.displayName());
            if (request.learningLevel() != null)
                profile.setLearningLevel(LearningLevel.valueOf(request.learningLevel()));
            if (request.dailyGoalWords() != null) profile.setDailyGoalWords(request.dailyGoalWords());
            profile.setNotificationsEnabled(request.notificationsEnabled());
            user.setProfile(profile);
            userRepository.save(user);
        }
    }

    public UserProfileResponse getUserProfileResponse(User user) {
        UserProfile profile = user.getProfile();

        // Build DTO
        return new UserProfileResponse(
                profile != null ? user.getDisplayName() : null,
                user.getEmail(),
               // profile != null ? profile.getLearningLevel().getValue() : null,
                null,
                profile != null ? profile.getDailyGoalWords() : null,
                profile != null && profile.isNotificationsEnabled()
        );
    }
}
