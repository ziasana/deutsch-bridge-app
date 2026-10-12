package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.*;
import org.hibernate.boot.Metadata;
import org.hibernate.boot.MetadataSources;
import org.hibernate.boot.registry.StandardServiceRegistry;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.core.io.support.EncodedResource;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

/**
 * Production uses Flyway + ddl-auto=validate, while the other tests build the schema with ddl-auto=update. This test applies
 * the real V33 migration to an empty PostgreSQL and lets Hibernate validate the exam simulation entities against it, so a
 * drift between the SQL and the mappings is caught before deployment.
 */
class ExamSimulationMigrationTest {

    @Test
    @DisplayName("V33__exam_simulation.sql matches the exam simulation entity mappings")
    void migrationMatchesEntities() throws Exception {
        String url = "jdbc:tc:postgresql:15:///migrationtest?TC_DAEMON=true";
        try (Connection c = DriverManager.getConnection(url, "test", "test")) {
            ScriptUtils.executeSqlScript(c, new EncodedResource(new ClassPathResource("db/migration/V33__exam_simulation.sql")));
            try (Statement st = c.createStatement()) {
                st.execute("SELECT 1");
            }
        }
        StandardServiceRegistry registry = new StandardServiceRegistryBuilder()
                .applySetting("hibernate.connection.url", url)
                .applySetting("hibernate.connection.username", "test")
                .applySetting("hibernate.connection.password", "test")
                .applySetting("hibernate.connection.driver_class", "org.testcontainers.jdbc.ContainerDatabaseDriver")
                .applySetting("hibernate.hbm2ddl.auto", "validate")
                .applySetting("hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect")
                .applySetting("hibernate.physical_naming_strategy", "org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy")
                .applySetting("hibernate.implicit_naming_strategy", "org.springframework.boot.orm.jpa.hibernate.SpringImplicitNamingStrategy")
                .build();
        try {
            MetadataSources sources = new MetadataSources(registry)
                    .addAnnotatedClass(ExamProfile.class)
                    .addAnnotatedClass(ExamSimulationAttempt.class)
                    .addAnnotatedClass(ExamSimulationAttemptPart.class)
                    .addAnnotatedClass(ExamSimulationAnswer.class)
                    .addAnnotatedClass(ExamSimulationUsage.class)
                    .addAnnotatedClass(ExamSimulationAssessment.class)
                    .addAnnotatedClass(ExamSimulationAudit.class);
            Metadata metadata = sources.buildMetadata();
            assertDoesNotThrow(() -> metadata.buildSessionFactory().close()); // hbm2ddl=validate fails on any mismatch
        } finally {
            StandardServiceRegistryBuilder.destroy(registry);
        }
    }
}
