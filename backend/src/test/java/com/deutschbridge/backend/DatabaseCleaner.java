package com.deutschbridge.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DatabaseCleaner
{
    @Autowired
    private JdbcTemplate jdbcTemplate;

    public void clean() {
        // Disable foreign key checks temporarily
        jdbcTemplate.execute("SET session_replication_role = replica;");

        // Get all tables in public schema
        List<String> tables = jdbcTemplate.queryForList(
                "SELECT tablename FROM pg_tables WHERE schemaname = 'public';",
                String.class
        );

        // Truncate each table and reset identity
        for (String table : tables) {
            jdbcTemplate.execute("TRUNCATE TABLE " + table + " RESTART IDENTITY CASCADE;");
        }

        // Re-enable foreign key checks
        jdbcTemplate.execute("SET session_replication_role = DEFAULT;");
    }
}
