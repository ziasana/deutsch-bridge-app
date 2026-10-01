package com.deutschbridge.backend.service;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

/** Seeds the built-in B1 training defaults on startup; levels that already have rows are left alone. */
@Component
public class ExamTimeConfigurationSeeder {

    @Bean
    public CommandLineRunner seedExamTimeConfigurations(ExamTimeConfigurationService service) {
        return args -> service.seedDefaults();
    }
}
