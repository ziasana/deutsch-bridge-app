package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.UserProfileRequest;
import com.deutschbridge.backend.model.dto.UserProfileResponse;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserProfile;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.PreferredLanguage;
import com.deutschbridge.backend.repository.UserProfileRepository;
import com.deutschbridge.backend.repository.UserRepository;
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


    public boolean update(String userId, UserProfileRequest request) throws DataNotFoundException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new DataNotFoundException("User not found"));
        UserProfile profile = user.getProfile();
        if (profile == null) {
            profile = new UserProfile();
            user.setDisplayName(request.displayName());
            profile.setLearningLevel(LearningLevel.valueOf(request.learningLevel()));
            profile.setDailyGoalWords(request.dailyGoalWords());
            profile.setNotificationsEnabled(request.notificationsEnabled());
            profile.setPreferredLanguage(PreferredLanguage.valueOf(request.preferredLanguage()));

            profile.setUser(user);
            user.setProfile(profile);
            userRepository.save(user);
            userProfileRepository.save(profile);
        } else {
            if (request.displayName() != null) user.setDisplayName(request.displayName());
            if (request.learningLevel() != null)
                profile.setLearningLevel(LearningLevel.valueOf(request.learningLevel()));
            if (request.dailyGoalWords() != null) profile.setDailyGoalWords(request.dailyGoalWords());
            profile.setNotificationsEnabled(request.notificationsEnabled());
            profile.setPreferredLanguage(PreferredLanguage.valueOf(request.preferredLanguage()));
            user.setProfile(profile);
            userRepository.save(user);
            userProfileRepository.save(profile);
        }
        return true;
    }

    public UserProfileResponse getUserProfileResponse(User user) {
        UserProfile profile = user.getProfile();

        return new UserProfileResponse(
                profile != null ? user.getDisplayName() : null,
                user.getEmail(),
                profile != null ? String.valueOf(profile.getLearningLevel()) : null,
                profile != null ? profile.getDailyGoalWords() : null,
                profile != null && profile.isNotificationsEnabled(),
                profile != null ? profile.getPreferredLanguage(): null
        );
    }
}
