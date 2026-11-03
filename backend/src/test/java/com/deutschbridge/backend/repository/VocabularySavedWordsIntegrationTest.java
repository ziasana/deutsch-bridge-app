package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.VocabularyItem;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** The "already saved" marks read just the words of one learner. */
@Testcontainers
@SpringBootTest(properties = "notifications.scheduler.enabled=false")
@ActiveProfiles("test")
@Transactional
class VocabularySavedWordsIntegrationTest {

    @Autowired private VocabularyItemRepository repository;
    @Autowired private UserRepository userRepository;

    private void item(User user, String word) {
        VocabularyItem item = new VocabularyItem();
        item.setUser(user);
        item.setWord(word);
        item.setLanguage("EN");
        repository.save(item);
    }

    @Test
    @DisplayName("findWordsByUser -> the words of this learner only")
    void savedWords() {
        User learner = userRepository.save(new User("Learner", "vocab-" + System.nanoTime() + "@test.local", "x"));
        User other = userRepository.save(new User("Other", "vocab-o-" + System.nanoTime() + "@test.local", "x"));
        item(learner, "Haus");
        item(learner, "Baum");
        item(other, "Fremd");

        List<String> words = repository.findWordsByUser(learner);

        assertEquals(List.of("Baum", "Haus"), words.stream().sorted().toList());
    }
}
