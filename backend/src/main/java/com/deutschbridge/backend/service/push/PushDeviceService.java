package com.deutschbridge.backend.service.push;

import com.deutschbridge.backend.model.entity.PushDevice;
import com.deutschbridge.backend.repository.PushDeviceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;

@Service
public class PushDeviceService {

    private final PushDeviceRepository repository;
    private final Clock clock;

    public PushDeviceService(PushDeviceRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    /** Idempotent. A token already known (e.g. another account used this device before) moves to this learner. */
    @Transactional
    public void register(String userId, String token, String platform) {
        Instant now = Instant.now(clock);
        PushDevice device = repository.findByToken(token).orElseGet(() -> {
            PushDevice created = new PushDevice();
            created.setToken(token);
            created.setCreatedAt(now);
            return created;
        });
        device.setUserId(userId);
        device.setPlatform(platform);
        device.setLastSeenAt(now);
        repository.save(device);
    }

    /** Only removes the learner's own registration; unknown tokens are ignored. */
    @Transactional
    public void unregister(String userId, String token) {
        repository.deleteByUserIdAndToken(userId, token);
    }
}
