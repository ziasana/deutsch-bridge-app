package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.OnboardingRequest;
import com.deutschbridge.backend.model.dto.UserProfileRequest;
import com.deutschbridge.backend.model.dto.UserProfileResponse;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserProfile;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningFocus;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.LearningReason;
import com.deutschbridge.backend.model.enums.PreferredLanguage;
import com.deutschbridge.backend.repository.UserProfileRepository;
import com.deutschbridge.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

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

        UserProfile profile = new UserProfile();
        profile.setId(UUID.randomUUID().toString());
        profile.setUser(user);
        profile.setDisplayName(user.getDisplayName());
        profile.setPreferredLanguage(PreferredLanguage.EN);
        profile.setDailyGoalWords(userProfileResponse.dailyGoalWords());
        profile.setDailyGoalTime(30);
        profile.setLearningLevel(LearningLevel.B1);
        profile.setNotificationsEnabled(true);
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
            profile.setNotificationsEnabled(request.notificationsEnabled() == null || request.notificationsEnabled());
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
            if (request.notificationsEnabled() != null) profile.setNotificationsEnabled(request.notificationsEnabled());
            profile.setPreferredLanguage(PreferredLanguage.valueOf(request.preferredLanguage()));
            user.setProfile(profile);
            userRepository.save(user);
            userProfileRepository.save(profile);
        }
        return true;
    }

    /**
     * Applies the learner's onboarding answers to their profile in one shot and marks
     * onboarding as completed. Called once, from the final "your plan is ready" step.
     */
    public UserProfileResponse completeOnboarding(String userId, OnboardingRequest request) throws DataNotFoundException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new DataNotFoundException("User not found"));
        UserProfile profile = user.getProfile();
        if (profile == null) {
            profile = new UserProfile();
            profile.setUser(user);
            profile.setDisplayName(user.getDisplayName());
            user.setProfile(profile);
        }

        if (request.preferredLanguage() != null) {
            profile.setPreferredLanguage(PreferredLanguage.valueOf(request.preferredLanguage()));
        }
        profile.setLearningReasons(toEnumSet(request.learningReasons(), LearningReason::valueOf));
        profile.setCurrentLevelUnknown(request.currentLevelUnknown());
        profile.setLearningLevel(request.currentLevel() != null ? LearningLevel.valueOf(request.currentLevel()) : null);
        profile.setTargetLevel(LearningLevel.valueOf(request.targetLevel()));
        profile.setDailyGoalWords(request.dailyGoalWords());
        profile.setFocusAreas(toEnumSet(request.focusAreas(), LearningFocus::valueOf));

        boolean isExamPrep = profile.getLearningReasons().contains(LearningReason.EXAM);
        profile.setExamType(isExamPrep && request.examType() != null ? ExamType.valueOf(request.examType()) : null);
        profile.setExamLevel(isExamPrep && request.examLevel() != null ? LearningLevel.valueOf(request.examLevel()) : null);
        profile.setExamDate(isExamPrep ? request.examDate() : null);

        profile.setOnboardingCompleted(true);

        userRepository.save(user);
        userProfileRepository.save(profile);
        return getUserProfileResponse(user);
    }

    private <E extends Enum<E>> Set<E> toEnumSet(List<String> values, java.util.function.Function<String, E> parser) {
        if (values == null) return Set.of();
        return values.stream().map(parser).collect(Collectors.toSet());
    }

    public UserProfileResponse getUserProfileResponse(User user) {
        UserProfile profile = user.getProfile();

        return new UserProfileResponse(
                profile != null ? user.getDisplayName() : null,
                user.getEmail(),
                profile != null && profile.getLearningLevel() != null ? profile.getLearningLevel().getValue() : null,
                profile != null ? profile.getDailyGoalWords() : null,
                profile != null && profile.isNotificationsEnabled(),
                profile != null ? profile.getPreferredLanguage(): null,
                user.getRole(),
                user.getAvatarUrl(),
                user.getCreatedAt(),
                profile != null && profile.isOnboardingCompleted(),
                profile != null ? profile.getLearningReasons().stream().map(Enum::name).collect(Collectors.toList()) : List.of(),
                profile != null && profile.isCurrentLevelUnknown(),
                profile != null && profile.getTargetLevel() != null ? profile.getTargetLevel().getValue() : null,
                profile != null ? profile.getFocusAreas().stream().map(Enum::name).collect(Collectors.toList()) : List.of(),
                profile != null && profile.getExamType() != null ? profile.getExamType().name() : null,
                profile != null && profile.getExamLevel() != null ? profile.getExamLevel().getValue() : null,
                profile != null ? profile.getExamDate() : null
        );
    }
}
