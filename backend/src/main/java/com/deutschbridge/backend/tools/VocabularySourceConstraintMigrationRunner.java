package com.deutschbridge.backend.tools;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Hibernate's ddl-auto=update generates a CHECK constraint for the VocabularySource enum column
 * when the table is first created, but never widens it when a new enum value (AI_TUTOR) is added
 * later - so without this, every AI_TUTOR insert fails with "violates check constraint
 * vocabulary_items_source_check". Re-applying the same DROP+ADD on every boot is idempotent and
 * cheap, so this just always runs rather than trying to detect whether it's already up to date.
 */
@Component
@Order(1)
public class VocabularySourceConstraintMigrationRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(VocabularySourceConstraintMigrationRunner.class);

    private final JdbcTemplate jdbcTemplate;

    public VocabularySourceConstraintMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        jdbcTemplate.execute("ALTER TABLE vocabulary_items DROP CONSTRAINT IF EXISTS vocabulary_items_source_check");
        jdbcTemplate.execute(
                "ALTER TABLE vocabulary_items ADD CONSTRAINT vocabulary_items_source_check " +
                        "CHECK (source IN ('CUSTOM','DICTIONARY','AI_TUTOR'))");
        log.info("vocabulary_items_source_check constraint synced with VocabularySource enum");
    }
}
