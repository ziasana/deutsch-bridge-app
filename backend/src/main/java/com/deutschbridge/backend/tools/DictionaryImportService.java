package com.deutschbridge.backend.tools;

import com.deutschbridge.backend.model.entity.DictionaryEntry;
import com.deutschbridge.backend.model.entity.Example;
import com.deutschbridge.backend.model.entity.Sense;
import com.deutschbridge.backend.repository.DictionaryEntryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Offline bundled-dataset import (spec "Data source" option 1). Reads the normalized JSONL
 * produced by scripts/dictionary-import/transform.py (one Wiktextract-derived lemma per line)
 * and bulk-inserts DictionaryEntry/Sense/Example rows via the app's own JPA repositories, so it
 * reuses the same NanoId generation and cascades as the running application. Never runs on normal
 * boot - only when DictionaryImportRunner's gate property is set. Re-runnable: entries whose
 * lemma already exists are skipped.
 */
@Service
public class DictionaryImportService {

    private static final Logger log = LoggerFactory.getLogger(DictionaryImportService.class);
    private static final int BATCH_SIZE = 500;
    private static final String BUNDLED_SOURCE = "bundled_dataset";

    private final DictionaryEntryRepository dictionaryEntryRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PersistenceContext
    private EntityManager entityManager;

    public DictionaryImportService(DictionaryEntryRepository dictionaryEntryRepository) {
        this.dictionaryEntryRepository = dictionaryEntryRepository;
    }

    /**
     * ddl-auto=update only adds missing columns, it never widens an existing one - so if this
     * table was already created (e.g. by an earlier partial import) with the default varchar(255)
     * before these fields got columnDefinition="TEXT", widen it here once. A no-op once the
     * columns are already TEXT.
     */
    @Transactional
    public void widenLegacyColumns() {
        entityManager.createNativeQuery("""
                ALTER TABLE dictionary_entry
                    ALTER COLUMN lemma TYPE text,
                    ALTER COLUMN ipa TYPE text,
                    ALTER COLUMN audio_url TYPE text
                """).executeUpdate();
        entityManager.createNativeQuery("ALTER TABLE dictionary_example ALTER COLUMN audio_url TYPE text")
                .executeUpdate();
    }

    public void importFromFile(Path path) throws IOException {
        long start = System.currentTimeMillis();
        int read = 0;
        int imported = 0;
        int skippedExisting = 0;
        int skippedInvalid = 0;
        List<DictionaryEntry> batch = new ArrayList<>(BATCH_SIZE);

        // Bulk-loaded once instead of a per-row existence query - the difference between this
        // import taking minutes vs. hours over a remote DB connection.
        Set<String> existingLemmas = new HashSet<>(dictionaryEntryRepository.findAllLemmasLowercase());
        log.info("Loaded {} existing lemmas for dedup", existingLemmas.size());

        try (BufferedReader reader = Files.newBufferedReader(path)) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty()) continue;
                read++;

                DictionaryImportRecord record;
                try {
                    record = objectMapper.readValue(line, DictionaryImportRecord.class);
                } catch (Exception e) {
                    skippedInvalid++;
                    continue;
                }

                if (record.lemma == null || record.lemma.isBlank() || record.senses == null || record.senses.isEmpty()) {
                    skippedInvalid++;
                    continue;
                }

                String key = record.lemma.toLowerCase();
                if (!existingLemmas.add(key)) {
                    skippedExisting++;
                    continue;
                }

                batch.add(toEntity(record));
                if (batch.size() >= BATCH_SIZE) {
                    saveBatch(batch);
                    imported += batch.size();
                    batch = new ArrayList<>(BATCH_SIZE);
                    if (imported % 2000 == 0) {
                        log.info("Dictionary import progress: {} read, {} imported, {} skipped (existing), {} skipped (invalid)",
                                read, imported, skippedExisting, skippedInvalid);
                    }
                }
            }
        }

        if (!batch.isEmpty()) {
            saveBatch(batch);
            imported += batch.size();
        }

        long seconds = (System.currentTimeMillis() - start) / 1000;
        log.info("Dictionary import finished in {}s: {} lines read, {} imported, {} skipped (existing), {} skipped (invalid)",
                seconds, read, imported, skippedExisting, skippedInvalid);
    }

    @Transactional
    public void saveBatch(List<DictionaryEntry> batch) {
        dictionaryEntryRepository.saveAll(batch);
    }

    private DictionaryEntry toEntity(DictionaryImportRecord record) {
        DictionaryEntry entry = new DictionaryEntry();
        entry.setLemma(record.lemma);
        entry.setIpa(record.ipa);
        entry.setAudioUrl(record.audioUrl);
        entry.setArticle(record.article);
        entry.setSource(BUNDLED_SOURCE);

        List<Sense> senses = new ArrayList<>();
        int order = 0;
        for (DictionaryImportRecord.ImportedSense importedSense : record.senses) {
            Sense sense = new Sense();
            sense.setEntry(entry);
            sense.setPos(importedSense.pos);
            sense.setTranslations(importedSense.translations != null ? importedSense.translations : List.of());
            sense.setSortOrder(order++);

            List<Example> examples = new ArrayList<>();
            if (importedSense.examples != null) {
                for (DictionaryImportRecord.ImportedExample importedExample : importedSense.examples) {
                    Example example = new Example();
                    example.setSense(sense);
                    example.setDe(importedExample.de);
                    example.setEn(importedExample.en);
                    example.setAudioUrl(importedExample.audioUrl);
                    examples.add(example);
                }
            }
            sense.setExamples(examples);
            senses.add(sense);
        }
        entry.setSenses(senses);

        return entry;
    }
}
