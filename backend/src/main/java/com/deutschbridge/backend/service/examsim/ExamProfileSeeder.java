package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.repository.ExamProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Seeds the telc B1 profile as a DRAFT once. It deliberately is not published: an admin has to confirm the values against
 * the official documentation (verification note) and that enough content exists before learners can start it.
 */
@Component
@ConditionalOnProperty(name = "exam.simulation.seed-default-profile", havingValue = "true", matchIfMissing = true)
public class ExamProfileSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ExamProfileSeeder.class);

    private final ExamProfileRepository repository;
    private final ExamProfileService service;

    public ExamProfileSeeder(ExamProfileRepository repository, ExamProfileService service) {
        this.repository = repository;
        this.service = service;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (repository.existsByCode(TelcB1ProfileFactory.CODE)) return;
        service.create(TelcB1ProfileFactory.request(), "SYSTEM");
        log.info("Seeded exam profile {} as DRAFT - verify and publish it in the admin area.", TelcB1ProfileFactory.CODE);
    }
}
