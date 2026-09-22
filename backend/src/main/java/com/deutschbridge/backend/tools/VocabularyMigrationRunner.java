package com.deutschbridge.backend.tools;

import com.deutschbridge.backend.model.entity.DictionaryEntry;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.VocabularyItem;
import com.deutschbridge.backend.model.entity.VocabularyProgress;
import com.deutschbridge.backend.model.enums.VocabularyMasteryLevel;
import com.deutschbridge.backend.model.enums.VocabularySource;
import com.deutschbridge.backend.repository.DictionaryEntryRepository;
import com.deutschbridge.backend.repository.UserRepository;
import com.deutschbridge.backend.repository.VocabularyItemRepository;
import com.deutschbridge.backend.repository.VocabularyProgressRepository;
import com.deutschbridge.backend.util.VocabularyMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * One-time data migration from the old Vocabulary/VocabularyContent/UserVocabularyPractice/
 * UserVocab tables to the unified VocabularyItem/VocabularyProgress model (see the vocabulary
 * redesign plan). Since the old entity classes are deleted from the codebase, this reads them via
 * plain JDBC against the old table names instead of JPA repositories - the tables themselves are
 * left in place afterwards (not dropped), as a documented safety net for one release cycle.
 *
 * Idempotent/guarded: only runs when vocabulary_items is still empty AND at least one of the old
 * tables actually has rows - so it's a no-op on every boot after the first successful migration,
 * and a no-op on a brand-new install that never had the old tables at all.
 */
@Component
public class VocabularyMigrationRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(VocabularyMigrationRunner.class);

    private final JdbcTemplate jdbcTemplate;
    private final VocabularyItemRepository vocabularyItemRepository;
    private final VocabularyProgressRepository vocabularyProgressRepository;
    private final UserRepository userRepository;
    private final DictionaryEntryRepository dictionaryEntryRepository;

    public VocabularyMigrationRunner(JdbcTemplate jdbcTemplate,
                                      VocabularyItemRepository vocabularyItemRepository,
                                      VocabularyProgressRepository vocabularyProgressRepository,
                                      UserRepository userRepository,
                                      DictionaryEntryRepository dictionaryEntryRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.vocabularyItemRepository = vocabularyItemRepository;
        this.vocabularyProgressRepository = vocabularyProgressRepository;
        this.userRepository = userRepository;
        this.dictionaryEntryRepository = dictionaryEntryRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (vocabularyItemRepository.count() != 0) {
            return;
        }
        long legacyCustomRows = tableRowCount("vocabularies");
        long legacyDictionaryRows = tableRowCount("user_vocab");
        if (legacyCustomRows <= 0 && legacyDictionaryRows <= 0) {
            return;
        }

        log.info("Starting vocabulary migration - {} legacy 'vocabularies' rows, {} legacy 'user_vocab' rows found",
                legacyCustomRows, legacyDictionaryRows);

        int migratedCustomItems = migrateCustomVocabulary();
        int migratedDictionaryItems = migrateDictionarySaves();

        log.info("Vocabulary migration finished: {} custom VocabularyItem rows, {} dictionary VocabularyItem rows migrated",
                migratedCustomItems, migratedDictionaryItems);
    }

    /** Step 1+2 of the plan: one VocabularyItem(source=CUSTOM) per (Vocabulary, VocabularyContent)
     *  pair, then one VocabularyProgress per resulting item for that Vocabulary's practice row. */
    private int migrateCustomVocabulary() {
        List<Map<String, Object>> contentRows;
        try {
            contentRows = jdbcTemplate.queryForList("""
                    SELECT v.id AS vocab_id, v.word AS word, v.example AS example, v.synonyms AS synonyms,
                           v.user_id AS user_id, vc.meaning AS meaning, vc.language AS language
                    FROM vocabularies v
                    JOIN vocabulary_contents vc ON vc.vocabulary_id = v.id
                    """);
        } catch (DataAccessException e) {
            log.warn("Could not read legacy vocabularies/vocabulary_contents tables, skipping custom-word migration: {}", e.getMessage());
            return 0;
        }

        Map<String, List<VocabularyItem>> itemsByLegacyVocabId = new HashMap<>();
        int itemCount = 0;
        for (Map<String, Object> row : contentRows) {
            String vocabId = (String) row.get("vocab_id");
            String userId = (String) row.get("user_id");
            User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
            if (user == null) {
                log.warn("Skipping legacy vocabulary {} - owning user {} not found", vocabId, userId);
                continue;
            }

            VocabularyItem item = new VocabularyItem();
            item.setUser(user);
            item.setSource(VocabularySource.CUSTOM);
            item.setWord((String) row.get("word"));
            item.setExample((String) row.get("example"));
            item.setSynonyms((String) row.get("synonyms"));
            item.setMeaning((String) row.get("meaning"));
            item.setLanguage((String) row.get("language"));
            item = vocabularyItemRepository.save(item);

            itemsByLegacyVocabId.computeIfAbsent(vocabId, k -> new ArrayList<>()).add(item);
            itemCount++;
        }

        int progressCount = migrateCustomPractice(itemsByLegacyVocabId);
        log.info("Custom-word migration: {} VocabularyItem rows (from {} legacy vocabularies), {} VocabularyProgress rows",
                itemCount, itemsByLegacyVocabId.size(), progressCount);
        return itemCount;
    }

    private int migrateCustomPractice(Map<String, List<VocabularyItem>> itemsByLegacyVocabId) {
        List<Map<String, Object>> practiceRows;
        try {
            practiceRows = jdbcTemplate.queryForList("""
                    SELECT vocabulary_id, known_count, unknown_count, success_rate
                    FROM user_vocabulary_practice
                    """);
        } catch (DataAccessException e) {
            log.warn("Could not read legacy user_vocabulary_practice table, skipping practice migration: {}", e.getMessage());
            return 0;
        }

        int progressCount = 0;
        for (Map<String, Object> row : practiceRows) {
            String vocabId = (String) row.get("vocabulary_id");
            List<VocabularyItem> items = itemsByLegacyVocabId.get(vocabId);
            if (items == null || items.isEmpty()) continue;

            int knownCount = toInt(row.get("known_count"));
            int unknownCount = toInt(row.get("unknown_count"));
            int successRate = toInt(row.get("success_rate"));

            for (VocabularyItem item : items) {
                VocabularyProgress progress = new VocabularyProgress();
                progress.setUser(item.getUser());
                progress.setVocabularyItem(item);
                progress.setRecallScore(clamp(successRate));
                progress.setContextScore(0);
                progress.setReviewCount(knownCount + unknownCount);
                progress.setCorrectCount(knownCount);
                progress.setIncorrectCount(unknownCount);
                progress.setNextReviewAt(LocalDateTime.now());
                progress.setMasteryLevel(VocabularyMapper.computeMasteryLevel(progress));
                vocabularyProgressRepository.save(progress);
                progressCount++;
            }
        }
        return progressCount;
    }

    /** Step 3 of the plan: one VocabularyItem(source=DICTIONARY) + VocabularyProgress per legacy
     *  UserVocab row, with a rough score/mastery backfill derived from the old status string since
     *  there's no SRS/review history to compute it from. */
    private int migrateDictionarySaves() {
        List<Map<String, Object>> rows;
        try {
            rows = jdbcTemplate.queryForList("SELECT user_id, entry_id, status FROM user_vocab");
        } catch (DataAccessException e) {
            log.warn("Could not read legacy user_vocab table, skipping dictionary-save migration: {}", e.getMessage());
            return 0;
        }

        int itemCount = 0;
        for (Map<String, Object> row : rows) {
            String userId = (String) row.get("user_id");
            String entryId = (String) row.get("entry_id");
            String status = (String) row.get("status");

            User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
            DictionaryEntry entry = entryId != null ? dictionaryEntryRepository.findById(entryId).orElse(null) : null;
            if (user == null || entry == null) {
                log.warn("Skipping legacy user_vocab row - user {} or dictionary entry {} not found", userId, entryId);
                continue;
            }
            if (vocabularyItemRepository.existsByUserAndDictionaryEntry(user, entry)) {
                continue; // already migrated (re-run safety, shouldn't normally trigger given the count()==0 guard)
            }

            VocabularyItem item = new VocabularyItem();
            item.setUser(user);
            item.setSource(VocabularySource.DICTIONARY);
            item.setDictionaryEntry(entry);
            item.setWord(entry.getLemma());
            item.setArticle(entry.getArticle());
            item.setAudioUrl(entry.getAudioUrl());
            item.setMeaning(firstMeaning(entry));
            item = vocabularyItemRepository.save(item);
            itemCount++;

            VocabularyProgress progress = new VocabularyProgress();
            progress.setUser(user);
            progress.setVocabularyItem(item);
            progress.setContextScore(0);
            progress.setNextReviewAt(LocalDateTime.now());
            applyLegacyStatusBackfill(progress, status);
            vocabularyProgressRepository.save(progress);
        }

        log.info("Dictionary-save migration: {} VocabularyItem rows (from {} legacy user_vocab rows)", itemCount, rows.size());
        return itemCount;
    }

    /** "known" -> FAMILIAR/70, "learning" -> LEARNING/40, "new"/anything else -> NEW/0 (ascending,
     *  matching the mastery enum's own ordering - see the plan's migration step 3). */
    private void applyLegacyStatusBackfill(VocabularyProgress progress, String status) {
        String normalized = status == null ? "new" : status.trim().toLowerCase();
        switch (normalized) {
            case "known" -> {
                progress.setMasteryLevel(VocabularyMasteryLevel.FAMILIAR);
                progress.setRecallScore(70);
            }
            case "learning" -> {
                progress.setMasteryLevel(VocabularyMasteryLevel.LEARNING);
                progress.setRecallScore(40);
            }
            default -> {
                progress.setMasteryLevel(VocabularyMasteryLevel.NEW);
                progress.setRecallScore(0);
            }
        }
    }

    private String firstMeaning(DictionaryEntry entry) {
        if (entry.getSenses() == null || entry.getSenses().isEmpty()) return null;
        var firstSense = entry.getSenses().get(0);
        if (firstSense.getTranslations() == null || firstSense.getTranslations().isEmpty()) return null;
        return firstSense.getTranslations().get(0);
    }

    private long tableRowCount(String table) {
        try {
            Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + table, Long.class);
            return count != null ? count : 0;
        } catch (DataAccessException e) {
            return 0;
        }
    }

    private int toInt(Object value) {
        return value instanceof Number number ? number.intValue() : 0;
    }

    private double clamp(double value) {
        return Math.max(0, Math.min(100, value));
    }
}
