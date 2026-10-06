package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.AiUsageResponse;
import com.deutschbridge.backend.model.entity.FeatureLimit;
import com.deutschbridge.backend.model.entity.FeatureUsage;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.AccountType;
import com.deutschbridge.backend.model.enums.FeatureType;
import com.deutschbridge.backend.repository.FeatureUsageRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class EntitlementServiceUsageTest {

    private final AppSettingService settings = mock(AppSettingService.class);
    private final FeatureLimitService limits = mock(FeatureLimitService.class);
    private final FeatureUsageRepository usages = mock(FeatureUsageRepository.class);
    private final UserService users = mock(UserService.class);
    private final EntitlementService service = new EntitlementService(settings, limits, usages, users);

    private static FeatureLimit limit(FeatureType type, int daily, boolean enabled) {
        FeatureLimit l = new FeatureLimit();
        l.setFeatureType(type);
        l.setAccountType(AccountType.BASIC);
        l.setDailyLimit(daily);
        l.setEnabled(enabled);
        return l;
    }

    @Test
    @DisplayName("reports nothing to count while the Premium switch is off")
    void notEnforced() {
        when(settings.isPremiumEnabled()).thenReturn(false);

        AiUsageResponse usage = service.usageFor("u1");

        assertFalse(usage.enforced());
        assertTrue(usage.features().isEmpty());
        verifyNoInteractions(limits, usages);
    }

    @Test
    @DisplayName("reports limit, used and remaining per feature")
    void remaining() throws Exception {
        when(settings.isPremiumEnabled()).thenReturn(true);
        User user = new User();
        user.setAccountType(AccountType.BASIC);
        when(users.findById("u1")).thenReturn(user);
        for (FeatureType t : FeatureType.values()) {
            when(limits.get(t, AccountType.BASIC)).thenReturn(limit(t, 5, t != FeatureType.AI_SYNONYM));
        }
        FeatureUsage chat = new FeatureUsage();
        chat.setCount(3);
        when(usages.findByUserIdAndFeatureTypeAndUsageDate(any(), any(), any())).thenReturn(Optional.empty());
        when(usages.findByUserIdAndFeatureTypeAndUsageDate(eq("u1"), eq(FeatureType.AI_CHAT), eq(LocalDate.now())))
                .thenReturn(Optional.of(chat));
        FeatureUsage over = new FeatureUsage();
        over.setCount(9); // limit lowered by an admin below today's usage
        when(usages.findByUserIdAndFeatureTypeAndUsageDate(eq("u1"), eq(FeatureType.AI_CORRECTION), any()))
                .thenReturn(Optional.of(over));

        AiUsageResponse usage = service.usageFor("u1");

        assertTrue(usage.enforced());
        assertEquals(new AiUsageResponse.FeatureUsageDto(5, 3, 2, true), usage.features().get(FeatureType.AI_CHAT));
        assertEquals(new AiUsageResponse.FeatureUsageDto(5, 0, 5, true), usage.features().get(FeatureType.AI_WRITING_FEEDBACK));
        assertEquals(0, usage.features().get(FeatureType.AI_CORRECTION).remaining());
        assertFalse(usage.features().get(FeatureType.AI_SYNONYM).enabled());
    }
}
