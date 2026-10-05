package com.deutschbridge.backend.service.push;

import com.deutschbridge.backend.model.entity.PushDevice;
import com.deutschbridge.backend.repository.PushDeviceRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class PushDeviceServiceTest {

    private static final Instant NOW = Instant.parse("2026-10-05T10:00:00Z");
    private final PushDeviceRepository repository = mock(PushDeviceRepository.class);
    private final PushDeviceService service = new PushDeviceService(repository, Clock.fixed(NOW, ZoneOffset.UTC));

    @Test
    @DisplayName("registers a new device")
    void registersNew() {
        when(repository.findByToken("ExponentPushToken[a]")).thenReturn(Optional.empty());

        service.register("u1", "ExponentPushToken[a]", "ios");

        ArgumentCaptor<PushDevice> saved = ArgumentCaptor.forClass(PushDevice.class);
        verify(repository).save(saved.capture());
        assertEquals("u1", saved.getValue().getUserId());
        assertEquals("ios", saved.getValue().getPlatform());
        assertEquals(NOW, saved.getValue().getCreatedAt());
        assertEquals(NOW, saved.getValue().getLastSeenAt());
    }

    @Test
    @DisplayName("re-assigns a known token to the learner who signed in on that device")
    void movesToNewOwner() {
        PushDevice existing = new PushDevice("d1", "old", "ExponentPushToken[a]", "ios", NOW.minusSeconds(999), NOW.minusSeconds(999));
        when(repository.findByToken("ExponentPushToken[a]")).thenReturn(Optional.of(existing));

        service.register("new", "ExponentPushToken[a]", "android");

        verify(repository).save(existing);
        assertEquals("new", existing.getUserId());
        assertEquals("android", existing.getPlatform());
        assertEquals(NOW.minusSeconds(999), existing.getCreatedAt());
        assertEquals(NOW, existing.getLastSeenAt());
    }

    @Test
    @DisplayName("unregister only touches the learner's own registration")
    void unregisters() {
        service.unregister("u1", "ExponentPushToken[a]");
        verify(repository).deleteByUserIdAndToken("u1", "ExponentPushToken[a]");
    }
}
