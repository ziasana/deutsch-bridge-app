package com.deutschbridge.backend.service;

import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Supplier;

/**
 * Times the steps of one request and logs them in a single line when the total passes a threshold, so a slow endpoint
 * names its slow step without a profiler. Cheap enough to leave on; silent for fast requests.
 */
final class StepTimer {

    private final Logger log;
    private final String name;
    private final long thresholdMs;
    private final long start = System.nanoTime();
    private final List<String> steps = new ArrayList<>();

    StepTimer(Logger log, String name, long thresholdMs) {
        this.log = log;
        this.name = name;
        this.thresholdMs = thresholdMs;
    }

    <T> T time(String step, Supplier<T> work) {
        long begin = System.nanoTime();
        try {
            return work.get();
        } finally {
            steps.add(step + "=" + (System.nanoTime() - begin) / 1_000_000 + "ms");
        }
    }

    void done() {
        long total = (System.nanoTime() - start) / 1_000_000;
        if (total >= thresholdMs) log.warn("{} took {}ms: {}", name, total, String.join(", ", steps));
    }
}
