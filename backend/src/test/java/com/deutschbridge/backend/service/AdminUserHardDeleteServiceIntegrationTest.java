package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.entity.*;
import com.deutschbridge.backend.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/** Runs the permanent user delete against a real PostgreSQL schema (Testcontainers, Hibernate-built). */
@Testcontainers
@SpringBootTest(properties = "notifications.scheduler.enabled=false")
@ActiveProfiles("test")
@Transactional
class AdminUserHardDeleteServiceIntegrationTest {

    @Autowired private AdminUserHardDeleteService service;
    @Autowired private UserRepository userRepository;
    @Autowired private ChatSessionRepository chatSessionRepository;
    @Autowired private ChatMessageRepository chatMessageRepository;
    @Autowired private VocabularyItemRepository vocabularyItemRepository;
    @Autowired private VocabularyBookmarkRepository vocabularyBookmarkRepository;
    @Autowired private PushDeviceRepository pushDeviceRepository;
    @Autowired private ExamExerciseBookmarkRepository examExerciseBookmarkRepository;
    @Autowired private JdbcTemplate jdbc;

    private User newUser(String role) {
        User u = new User("Name", "hd-" + System.nanoTime() + "@test.local", "x");
        u.setRole(role);
        return userRepository.saveAndFlush(u);
    }

    private long count(String table, String column, String value) {
        userRepository.flush();
        Long n = jdbc.queryForObject("SELECT count(*) FROM " + table + " WHERE " + column + " = ?", Long.class, value);
        return n == null ? 0 : n;
    }

    @Test
    @DisplayName("hardDelete -> removes the user and the data stored with and without an FK, and keeps other users' data")
    void hardDelete_shouldRemoveUserAndDependentData() throws Exception {
        User admin = newUser("ADMIN");
        User victim = newUser("STUDENT");
        victim.setDeleted(true);
        userRepository.saveAndFlush(victim);
        User other = newUser("STUDENT");

        ChatSession session = chatSessionRepository.save(new ChatSession("cs-" + System.nanoTime()));
        session.setUserId(victim.getId());
        chatSessionRepository.save(session);
        chatMessageRepository.save(new ChatMessage(session, "user", "hallo"));

        VocabularyItem item = new VocabularyItem();
        item.setId("vi-" + System.nanoTime());
        item.setUser(victim);
        item.setWord("Haus");
        item = vocabularyItemRepository.save(item);
        VocabularyBookmark bookmark = new VocabularyBookmark();
        bookmark.setUser(victim);
        bookmark.setVocabularyItem(item);
        vocabularyBookmarkRepository.save(bookmark);

        pushDeviceRepository.save(new PushDevice(null, victim.getId(), "tok-v-" + System.nanoTime(), "ios", Instant.now(), Instant.now()));
        PushDevice keep = pushDeviceRepository.save(new PushDevice(null, other.getId(), "tok-o-" + System.nanoTime(), "ios", Instant.now(), Instant.now()));
        ExamExerciseBookmark examBookmark = new ExamExerciseBookmark();
        examBookmark.setUserId(victim.getId());
        examBookmark.setExerciseId("ex-1");
        examExerciseBookmarkRepository.save(examBookmark);

        String email = service.hardDelete(admin.getId(), victim.getId(), victim.getEmail().toUpperCase());

        assertEquals(victim.getEmail(), email);
        assertEquals(0, count("users", "id", victim.getId()));
        assertEquals(0, count("chat_sessions", "user_id", victim.getId()));
        assertEquals(0, count("chat_messages", "chat_session_id", session.getId()));
        assertEquals(0, count("vocabulary_items", "user_id", victim.getId()));
        assertEquals(0, count("vocabulary_bookmarks", "user_id", victim.getId()));
        assertEquals(0, count("push_devices", "user_id", victim.getId()));
        assertEquals(0, count("exam_exercise_bookmarks", "user_id", victim.getId()));
        assertEquals(1, count("users", "id", other.getId()));
        assertEquals(1, count("push_devices", "id", keep.getId()));
    }

    @Test
    @DisplayName("hardDelete -> should reject self-deletion, a wrong confirmation email and a user that is not soft-deleted")
    void hardDelete_shouldRejectUnsafeRequests() {
        User admin = newUser("ADMIN");
        User student = newUser("STUDENT");
        User deleted = newUser("STUDENT");
        deleted.setDeleted(true);
        userRepository.saveAndFlush(deleted);

        assertThrows(IllegalArgumentException.class, () -> service.hardDelete(admin.getId(), admin.getId(), admin.getEmail()));
        assertThrows(IllegalArgumentException.class, () -> service.hardDelete(admin.getId(), student.getId(), student.getEmail()));
        assertThrows(IllegalArgumentException.class, () -> service.hardDelete(admin.getId(), deleted.getId(), "nope@test.local"));
        assertThrows(IllegalArgumentException.class, () -> service.hardDelete(admin.getId(), deleted.getId(), null));
        assertThrows(DataNotFoundException.class, () -> service.hardDelete(admin.getId(), "missing", "x@test.local"));
        assertEquals(1, count("users", "id", student.getId()));
        assertEquals(1, count("users", "id", deleted.getId()));
    }

    @Test
    @DisplayName("schema -> every table with a user_id column or an FK to users is covered by the cleanup")
    void everyUserReferencingTableIsCovered() {
        Set<String> covered = new HashSet<>(AdminUserHardDeleteService.USER_OWNED_TABLES);
        covered.addAll(List.of("chat_sessions", "vocabulary_items", "exam_simulation_attempts",
                // nulled instead of deleted
                "daily_words", "dictionary_missing_report"));

        List<String> referencing = jdbc.queryForList("""
                SELECT table_name FROM information_schema.columns
                WHERE table_schema = 'public' AND column_name = 'user_id'
                UNION
                SELECT tc.table_name FROM information_schema.table_constraints tc
                JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'users'
                """, String.class);

        Set<String> missing = new HashSet<>(referencing);
        missing.removeAll(covered);
        assertTrue(missing.isEmpty(), "Tables referencing users but not cleaned by AdminUserHardDeleteService: " + missing);
    }

    @Test
    @DisplayName("schema -> every table with an FK to a cleaned table is itself cleaned first")
    void everyChildOfACleanedTableIsCovered() {
        Set<String> cleaned = new HashSet<>(AdminUserHardDeleteService.USER_OWNED_TABLES);
        cleaned.addAll(List.of("users", "chat_sessions", "vocabulary_items", "exam_simulation_attempts", "chat_messages"));
        Set<String> children = new HashSet<>(AdminUserHardDeleteService.PROFILE_COLLECTION_TABLES);
        children.addAll(cleaned);
        children.addAll(List.of("daily_words", "dictionary_missing_report")); // FK nulled, rows kept

        List<String> fkChildren = jdbc.queryForList("""
                SELECT DISTINCT tc.table_name FROM information_schema.table_constraints tc
                JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = ANY (?)
                """, String.class, (Object) cleaned.toArray(new String[0]));

        Set<String> missing = new HashSet<>(fkChildren);
        missing.removeAll(children);
        assertTrue(missing.isEmpty(), "Tables with an FK to a cleaned table but not cleaned: " + missing);
    }
}
