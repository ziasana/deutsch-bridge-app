package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.repository.ExamSimulationAttemptRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;

/**
 * Finalises exams that ran out of time while nobody was looking (closed tab, lost connection). Each attempt is handled in
 * its own transaction; the row lock inside makes this safe to run on several instances at once.
 */
@Component
public class ExamSimulationExpiryJob {

    private static final Logger log = LoggerFactory.getLogger(ExamSimulationExpiryJob.class);

    private final ExamSimulationAttemptRepository attemptRepository;
    private final ExamSimulationService service;
    private final Clock clock;

    public ExamSimulationExpiryJob(ExamSimulationAttemptRepository attemptRepository, ExamSimulationService service, Clock clock) {
        this.attemptRepository = attemptRepository;
        this.service = service;
        this.clock = clock;
    }

    @Scheduled(fixedDelayString = "${exam.simulation.expiry-sweep-ms:60000}", initialDelayString = "${exam.simulation.expiry-sweep-ms:60000}")
    public void sweep() {
        run();
    }

    /** @return number of attempts expired */
    public int run() {
        Instant cutoff = clock.instant().minusMillis(service.graceMillis());
        int expired = 0;
        for (String id : attemptRepository.findOverdueIds(cutoff)) {
            try {
                if (service.expireIfOverdue(id)) expired++;
            } catch (RuntimeException e) {
                log.warn("Could not expire exam attempt {}: {}", id, e.getMessage());
            }
        }
        if (expired > 0) log.info("Expired {} overdue exam simulation attempt(s)", expired);
        return expired;
    }
}
