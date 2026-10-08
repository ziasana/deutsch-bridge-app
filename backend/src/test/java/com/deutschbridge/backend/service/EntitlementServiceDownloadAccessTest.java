package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.DownloadAccessResponse;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.AccountType;
import com.deutschbridge.backend.repository.FeatureUsageRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class EntitlementServiceDownloadAccessTest {

    private final AppSettingService settings = mock(AppSettingService.class);
    private final UserService users = mock(UserService.class);
    private final EntitlementService service = new EntitlementService(
            settings, mock(FeatureLimitService.class), mock(FeatureUsageRepository.class), users);

    private void accountType(AccountType type) throws Exception {
        User user = new User();
        user.setAccountType(type);
        when(users.findById("u1")).thenReturn(user);
    }

    @Test
    @DisplayName("everyone may download when downloads are not premium-only")
    void open() throws Exception {
        when(settings.isDownloadsPremiumOnly()).thenReturn(false);
        when(settings.isPremiumEnabled()).thenReturn(true);
        accountType(AccountType.BASIC);

        DownloadAccessResponse r = service.downloadAccessFor("u1");

        assertTrue(r.allowed());
        assertFalse(r.premiumOnly());
    }

    @Test
    @DisplayName("basic users are blocked, premium users allowed, when premium-only")
    void premiumOnly() throws Exception {
        when(settings.isDownloadsPremiumOnly()).thenReturn(true);
        when(settings.isPremiumEnabled()).thenReturn(true);

        accountType(AccountType.BASIC);
        assertFalse(service.downloadAccessFor("u1").allowed());

        accountType(AccountType.PREMIUM);
        assertTrue(service.downloadAccessFor("u1").allowed());
    }

    @Test
    @DisplayName("the restriction is not enforced while the global Premium switch is off")
    void premiumSystemOff() throws Exception {
        when(settings.isDownloadsPremiumOnly()).thenReturn(true);
        when(settings.isPremiumEnabled()).thenReturn(false);
        accountType(AccountType.BASIC);

        DownloadAccessResponse r = service.downloadAccessFor("u1");

        assertTrue(r.allowed());
        assertTrue(r.premiumOnly());
    }
}
