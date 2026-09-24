package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.UserProfile;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.PreferredLanguage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile,String> {

    // Find UserProfile by associated User's username
    @Query("SELECT up FROM user_profiles up WHERE up.user.email = :email")
    Optional<UserProfile> findByUsername(@Param("email") String email);

    /** For the admin analytics level filter: every user id whose self-reported learning level matches. */
    @Query("SELECT up.user.id FROM user_profiles up WHERE up.learningLevel = :level")
    List<String> findUserIdsByLearningLevel(@Param("level") LearningLevel level);

    /** Same as above, but excludes soft-deleted/disabled accounts - for resolving a broadcast audience. */
    @Query("SELECT up.user.id FROM user_profiles up WHERE up.learningLevel = :level " +
            "AND up.user.deleted = false AND up.user.enabled = true")
    List<String> findUserIdsByLearningLevelAndUserDeletedFalseAndUserEnabledTrue(@Param("level") LearningLevel level);

    /** For resolving a broadcast audience by preferred language - excludes soft-deleted/disabled accounts. */
    @Query("SELECT up.user.id FROM user_profiles up WHERE up.preferredLanguage = :language " +
            "AND up.user.deleted = false AND up.user.enabled = true")
    List<String> findUserIdsByPreferredLanguageAndUserDeletedFalseAndUserEnabledTrue(@Param("language") PreferredLanguage language);
}
