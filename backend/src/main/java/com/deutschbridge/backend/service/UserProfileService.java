package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.UserProfileDto;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserProfile;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.PreferredLanguage;
import com.deutschbridge.backend.repository.UserProfileRepository;
import com.deutschbridge.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserProfileService(UserProfileRepository userProfileRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userProfileRepository = userProfileRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserProfile save(UserProfileDto userProfileDto) {
        User user = userRepository.findByUsername(userProfileDto.username())
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserProfile profile = new UserProfile(
                UUID.randomUUID().toString(),
                user,
                userProfileDto.displayName(),
                PreferredLanguage.EN,
                userProfileDto.dailyGoalWords(),
                30,
                LearningLevel.B1,
                true
        );

        return userProfileRepository.save(profile);
    }


    public void update(UserProfileDto userProfileDto) {
        User user = userRepository.findByUsername(userProfileDto.username())
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserProfile profile= user.getProfile();
        if(profile == null) {
            profile = new UserProfile();
            profile.setDisplayName(userProfileDto.displayName());
            profile.setLearningLevel(LearningLevel.valueOf( userProfileDto.learningLevel()));
            profile.setDailyGoalWords(userProfileDto.dailyGoalWords());
            profile.setNotificationsEnabled(userProfileDto.notificationsEnabled());

            // 🔑 THIS IS THE KEY PART
            profile.setUser(user);
            user.setProfile(profile);
            userProfileRepository.save(profile);

        }else {
            if (userProfileDto.displayName() != null) profile.setDisplayName(userProfileDto.displayName());
            if (userProfileDto.learningLevel() != null)
                profile.setLearningLevel(LearningLevel.valueOf(userProfileDto.learningLevel()));
            if (userProfileDto.dailyGoalWords() != null) profile.setDailyGoalWords(userProfileDto.dailyGoalWords());
            profile.setNotificationsEnabled(userProfileDto.notificationsEnabled());
            user.setProfile(profile);
            userRepository.save(user);
        }
    }
}
