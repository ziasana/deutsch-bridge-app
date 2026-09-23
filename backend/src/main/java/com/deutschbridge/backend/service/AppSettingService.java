package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.AppSetting;
import com.deutschbridge.backend.repository.AppSettingRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

/**
 * Generic admin-configurable key/value settings. Currently backs the global Premium switch, kept
 * separate from a user's own {@code accountType} so premium infrastructure can be built and tested
 * before it's turned on for real users (see EntitlementService).
 */
@Service
public class AppSettingService {

    public static final String PREMIUM_ENABLED_KEY = "premium.enabled";

    private final AppSettingRepository appSettingRepository;

    public AppSettingService(AppSettingRepository appSettingRepository) {
        this.appSettingRepository = appSettingRepository;
    }

    @PostConstruct
    public void seedDefaults() {
        appSettingRepository.findById(PREMIUM_ENABLED_KEY).orElseGet(() ->
                appSettingRepository.save(new AppSetting(PREMIUM_ENABLED_KEY, "false", "Enables Premium account entitlements globally.")));
    }

    public boolean isPremiumEnabled() {
        return getBoolean(PREMIUM_ENABLED_KEY, false);
    }

    public void setPremiumEnabled(boolean enabled) {
        setValue(PREMIUM_ENABLED_KEY, String.valueOf(enabled));
    }

    public boolean getBoolean(String key, boolean defaultValue) {
        return appSettingRepository.findById(key)
                .map(AppSetting::getValue)
                .map(Boolean::parseBoolean)
                .orElse(defaultValue);
    }

    public int getInt(String key, int defaultValue) {
        return appSettingRepository.findById(key)
                .map(AppSetting::getValue)
                .map(v -> {
                    try {
                        return Integer.parseInt(v.trim());
                    } catch (NumberFormatException e) {
                        return defaultValue;
                    }
                })
                .orElse(defaultValue);
    }

    public String getString(String key, String defaultValue) {
        return appSettingRepository.findById(key)
                .map(AppSetting::getValue)
                .orElse(defaultValue);
    }

    /** Creates the setting with its default value only if it doesn't exist yet (never overwrites admin changes). */
    public void seedIfMissing(String key, String value, String description) {
        if (!appSettingRepository.existsById(key)) {
            appSettingRepository.save(new AppSetting(key, value, description));
        }
    }

    public void setValue(String key, String value) {
        AppSetting setting = appSettingRepository.findById(key)
                .orElseGet(() -> new AppSetting(key, value, null));
        setting.setValue(value);
        appSettingRepository.save(setting);
    }
}
