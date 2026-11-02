package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Permanent (hard) delete of a user and everything that belongs to them. The soft delete in
 * {@link UserService#adminSoftDelete} keeps all data; this one removes it.
 *
 * <p>Most user-owned tables only store a plain {@code user_id} string (no FK), so a bare {@code DELETE FROM users}
 * would silently leave orphans, while the tables that do have an FK would reject it. Every table is therefore cleaned
 * explicitly, children before parents, in one transaction. {@link #USER_OWNED_TABLES} is the single list of
 * tables with a {@code user_id} column; a test checks it against the real schema.
 */
@Service
public class AdminUserHardDeleteService {

    static final String ADMIN_ROLE = "ADMIN";

    /** Tables whose {@code user_id} column holds the owning user and whose rows are removed with that user. */
    static final List<String> USER_OWNED_TABLES = List.of(
            "exam_attempt",
            "exam_exercise_bookmarks",
            "exam_exercise_completions",
            "exam_practice_sessions",
            "exam_simulation_usage",
            "exercise_progress",
            "expression_bookmarks",
            "expression_progress",
            "feature_usages",
            "grammar_category_test_attempts",
            "grammar_lesson_bookmarks",
            "learning_activity",
            "learning_progress",
            "notification_preferences",
            "notifications",
            "push_devices",
            "reading_article_bookmarks",
            "redemittel_collection",
            "redemittel_progress",
            "speaking_learn_progress",
            "user_article_attempt",
            "user_profiles",
            "user_word_progress",
            "vocabulary_bookmarks",
            "vocabulary_progress",
            "writing_attempts",
            "writing_learn_progress"
    );

    private final UserRepository userRepository;

    @PersistenceContext
    private EntityManager em;

    public AdminUserHardDeleteService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * @return the deleted user's email (for the audit log)
     * @throws IllegalArgumentException for self-deletion, a wrong confirmation email, or the last admin
     * @throws DataNotFoundException    if the user does not exist
     */
    @Transactional
    public String hardDelete(String requestingAdminId, String userId, String confirmEmail) throws DataNotFoundException {
        if (userId.equals(requestingAdminId)) {
            throw new IllegalArgumentException("You can't delete your own account.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new DataNotFoundException("User not found"));
        if (confirmEmail == null || !user.getEmail().equalsIgnoreCase(confirmEmail.trim())) {
            throw new IllegalArgumentException("The confirmation email does not match this user.");
        }
        if (ADMIN_ROLE.equals(user.getRole()) && !user.isDeleted()
                && userRepository.countByRoleAndDeletedFalse(ADMIN_ROLE) <= 1) {
            throw new IllegalArgumentException("You can't delete the last admin account.");
        }

        String email = user.getEmail();
        deleteDependentData(userId);
        em.flush();
        em.clear();
        update("DELETE FROM users WHERE id = :uid", userId);
        return email;
    }

    private void deleteDependentData(String uid) {
        // chat: messages hang off the user's sessions
        update("DELETE FROM chat_messages WHERE chat_session_id IN (SELECT id FROM chat_sessions WHERE user_id = :uid)", uid);
        update("DELETE FROM chat_sessions WHERE user_id = :uid", uid);

        // exam simulation: parts/answers/assessments/audio plays/audit hang off the user's attempts
        for (String child : List.of("exam_simulation_attempt_parts", "exam_simulation_answers",
                "exam_simulation_assessments", "exam_simulation_audio_plays")) {
            update("DELETE FROM " + child + " WHERE attempt_id IN (SELECT id FROM exam_simulation_attempts WHERE user_id = :uid)", uid);
        }
        update("DELETE FROM exam_simulation_audit WHERE actor = :uid "
                + "OR subject_id IN (SELECT id FROM exam_simulation_attempts WHERE user_id = :uid)", uid);
        update("UPDATE exam_simulation_assessments SET assessor_id = NULL WHERE assessor_id = :uid", uid);
        update("DELETE FROM exam_simulation_attempts WHERE user_id = :uid", uid);

        // personal vocabulary: progress/bookmarks of ANY user pointing at this user's items go first
        update("DELETE FROM vocabulary_progress WHERE vocabulary_item_id IN (SELECT id FROM vocabulary_items WHERE user_id = :uid)", uid);
        update("DELETE FROM vocabulary_bookmarks WHERE vocabulary_item_id IN (SELECT id FROM vocabulary_items WHERE user_id = :uid)", uid);
        update("DELETE FROM vocabulary_items WHERE user_id = :uid", uid);

        // shared content that merely points at the user: keep the row, drop the link
        update("UPDATE daily_words SET assigned_to_id = NULL WHERE assigned_to_id = :uid", uid);
        update("UPDATE dictionary_missing_report SET reported_by_id = NULL WHERE reported_by_id = :uid", uid);

        for (String table : USER_OWNED_TABLES) {
            update("DELETE FROM " + table + " WHERE user_id = :uid", uid);
        }
    }

    private void update(String sql, String uid) {
        em.createNativeQuery(sql).setParameter("uid", uid).executeUpdate();
    }
}
