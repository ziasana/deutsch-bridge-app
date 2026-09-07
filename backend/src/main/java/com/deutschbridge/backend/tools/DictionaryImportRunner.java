package com.deutschbridge.backend.tools;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.nio.file.Path;

/**
 * Runs the bundled-dataset dictionary import exactly once, only when explicitly requested via
 * -Ddictionary.import.file=/path/to/normalized.jsonl (see scripts/dictionary-import). A no-op on
 * every normal boot - never runs unless that system property is set.
 */
@Component
public class DictionaryImportRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DictionaryImportRunner.class);

    private final DictionaryImportService importService;

    @Value("${dictionary.import.file:}")
    private String importFilePath;

    public DictionaryImportRunner(DictionaryImportService importService) {
        this.importService = importService;
    }

    @Override
    public void run(String... args) throws Exception {
        if (importFilePath == null || importFilePath.isBlank()) {
            return;
        }
        log.info("Starting dictionary bundled-dataset import from {}", importFilePath);
        importService.widenLegacyColumns();
        importService.importFromFile(Path.of(importFilePath));
    }
}
