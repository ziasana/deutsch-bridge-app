package com.deutschbridge.backend.service.notification;

import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.AccountType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.NotificationAudienceType;
import com.deutschbridge.backend.model.enums.PreferredLanguage;
import com.deutschbridge.backend.repository.UserProfileRepository;
import com.deutschbridge.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/** Resolves an admin broadcast's audience selection into the concrete user ids it targets. */
@Service
public class AudienceResolverService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    public AudienceResolverService(UserRepository userRepository, UserProfileRepository userProfileRepository) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
    }

    public List<String> resolveUserIds(NotificationAudienceType audienceType, LearningLevel level,
                                       AccountType accountType, PreferredLanguage language, List<String> specificUserIds) {
        validateSelector(audienceType, level, accountType, language, specificUserIds);
        return switch (audienceType) {
            case ALL -> userRepository.findIdsByDeletedFalseAndEnabledTrue();
            case LEVEL -> userProfileRepository.findUserIdsByLearningLevelAndUserDeletedFalseAndUserEnabledTrue(level);
            case ACCOUNT_TYPE -> userRepository.findIdsByDeletedFalseAndEnabledTrueAndAccountType(accountType);
            case LANGUAGE -> userProfileRepository.findUserIdsByPreferredLanguageAndUserDeletedFalseAndUserEnabledTrue(language);
            case SPECIFIC_USERS -> specificUserIds == null || specificUserIds.isEmpty()
                    ? List.of()
                    : userRepository.findAllById(specificUserIds).stream()
                            .filter(u -> !u.isDeleted() && u.isEnabled())
                            .map(User::getId)
                            .toList();
        };
    }

    /**
     * Which field each audience type requires - the single source of truth shared by resolution
     * here and by {@code NotificationBroadcastService.applyFields}'s fail-fast validation on save,
     * so a new audience type only needs updating in one place instead of two independent switches.
     */
    public void validateSelector(NotificationAudienceType audienceType, LearningLevel level,
                                 AccountType accountType, PreferredLanguage language, List<String> specificUserIds) {
        switch (audienceType) {
            case LEVEL -> {
                if (level == null) throw new IllegalArgumentException("audienceLevel is required for audienceType LEVEL");
            }
            case ACCOUNT_TYPE -> {
                if (accountType == null) throw new IllegalArgumentException("audienceAccountType is required for audienceType ACCOUNT_TYPE");
            }
            case LANGUAGE -> {
                if (language == null) throw new IllegalArgumentException("audienceLanguage is required for audienceType LANGUAGE");
            }
            case SPECIFIC_USERS -> {
                if (specificUserIds == null || specificUserIds.isEmpty()) {
                    throw new IllegalArgumentException("audienceUserIds is required for audienceType SPECIFIC_USERS");
                }
            }
            case ALL -> {
                // No selector required.
            }
        }
    }
}
