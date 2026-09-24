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
        return switch (audienceType) {
            case ALL -> userRepository.findIdsByDeletedFalseAndEnabledTrue();
            case LEVEL -> {
                if (level == null) throw new IllegalArgumentException("audienceLevel is required for audienceType LEVEL");
                yield userProfileRepository.findUserIdsByLearningLevelAndUserDeletedFalseAndUserEnabledTrue(level);
            }
            case ACCOUNT_TYPE -> {
                if (accountType == null) throw new IllegalArgumentException("audienceAccountType is required for audienceType ACCOUNT_TYPE");
                yield userRepository.findIdsByDeletedFalseAndEnabledTrueAndAccountType(accountType);
            }
            case LANGUAGE -> {
                if (language == null) throw new IllegalArgumentException("audienceLanguage is required for audienceType LANGUAGE");
                yield userProfileRepository.findUserIdsByPreferredLanguageAndUserDeletedFalseAndUserEnabledTrue(language);
            }
            case SPECIFIC_USERS -> {
                if (specificUserIds == null || specificUserIds.isEmpty()) yield List.of();
                yield userRepository.findAllById(specificUserIds).stream()
                        .filter(u -> !u.isDeleted() && u.isEnabled())
                        .map(User::getId)
                        .toList();
            }
        };
    }
}
