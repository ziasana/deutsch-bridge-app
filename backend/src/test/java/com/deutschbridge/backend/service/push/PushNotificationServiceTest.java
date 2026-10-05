package com.deutschbridge.backend.service.push;

import com.deutschbridge.backend.model.entity.PushDevice;
import com.deutschbridge.backend.repository.PushDeviceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class PushNotificationServiceTest {

    private static final String URL = "https://expo.test/push";

    private PushDeviceRepository devices;
    private MockRestServiceServer server;
    private PushNotificationService service;

    @BeforeEach
    void setUp() {
        devices = mock(PushDeviceRepository.class);
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        service = new PushNotificationService(devices, builder, true, URL, "");
    }

    private static PushDevice device(String userId, String token) {
        PushDevice d = new PushDevice();
        d.setUserId(userId);
        d.setToken(token);
        d.setPlatform("ios");
        return d;
    }

    private static NotificationsCreatedEvent.PushMessage message(String userId, String actionUrl) {
        return new NotificationsCreatedEvent.PushMessage(userId, "ntf-1", "Titel", "Text", actionUrl);
    }

    @Test
    @DisplayName("sends one message per device with the notification id and destination in data")
    void sendsToEveryDevice() {
        when(devices.findByUserIdIn(anyCollection())).thenReturn(List.of(
                device("u1", "ExponentPushToken[a]"), device("u1", "ExponentPushToken[b]"), device("u2", "ExponentPushToken[c]")));
        server.expect(requestTo(URL)).andExpect(method(HttpMethod.POST))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].to").value("ExponentPushToken[a]"))
                .andExpect(jsonPath("$[0].title").value("Titel"))
                .andExpect(jsonPath("$[0].data.notificationId").value("ntf-1"))
                .andExpect(jsonPath("$[0].data.actionUrl").value("/dashboard/grammar"))
                .andExpect(jsonPath("$[1].to").value("ExponentPushToken[b]"))
                .andRespond(withSuccess("{\"data\":[{\"status\":\"ok\"},{\"status\":\"ok\"}]}", MediaType.APPLICATION_JSON));

        service.onNotificationsCreated(new NotificationsCreatedEvent(List.of(message("u1", "/dashboard/grammar"))));

        server.verify();
        verify(devices, never()).deleteByTokenIn(anyCollection());
    }

    @Test
    @DisplayName("forgets tokens Expo reports as DeviceNotRegistered")
    void removesDeadTokens() {
        when(devices.findByUserIdIn(anyCollection())).thenReturn(List.of(
                device("u1", "ExponentPushToken[live]"), device("u1", "ExponentPushToken[dead]")));
        server.expect(requestTo(URL)).andRespond(withSuccess(
                "{\"data\":[{\"status\":\"ok\"},{\"status\":\"error\",\"message\":\"gone\",\"details\":{\"error\":\"DeviceNotRegistered\"}}]}",
                MediaType.APPLICATION_JSON));

        service.onNotificationsCreated(new NotificationsCreatedEvent(List.of(message("u1", null))));

        verify(devices).deleteByTokenIn(Set.of("ExponentPushToken[dead]"));
    }

    @Test
    @DisplayName("splits more than 100 messages into several requests")
    void batches() {
        List<PushDevice> many = new java.util.ArrayList<>();
        for (int i = 0; i < 150; i++) many.add(device("u1", "ExponentPushToken[" + i + "]"));
        when(devices.findByUserIdIn(anyCollection())).thenReturn(many);
        server.expect(requestTo(URL)).andExpect(jsonPath("$.length()").value(100)).andRespond(withSuccess("{\"data\":[]}", MediaType.APPLICATION_JSON));
        server.expect(requestTo(URL)).andExpect(jsonPath("$.length()").value(50)).andRespond(withSuccess("{\"data\":[]}", MediaType.APPLICATION_JSON));

        service.onNotificationsCreated(new NotificationsCreatedEvent(List.of(message("u1", null))));

        server.verify();
    }

    @Test
    @DisplayName("a failing push service never propagates to the caller")
    void swallowsFailures() {
        when(devices.findByUserIdIn(anyCollection())).thenReturn(List.of(device("u1", "ExponentPushToken[a]")));
        server.expect(requestTo(URL)).andRespond(withServerError());

        service.onNotificationsCreated(new NotificationsCreatedEvent(List.of(message("u1", null))));

        verify(devices, never()).deleteByTokenIn(anyCollection());
    }

    @Test
    @DisplayName("does nothing when push is disabled")
    void disabled() {
        PushNotificationService off = new PushNotificationService(devices, RestClient.builder(), false, URL, "");
        off.onNotificationsCreated(new NotificationsCreatedEvent(List.of(message("u1", null))));
        verifyNoInteractions(devices);
    }
}
