package com.deutschbridge.backend.service.notification;

import com.deutschbridge.backend.model.entity.NotificationTemplate;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserProfile;
import com.deutschbridge.backend.model.enums.PreferredLanguage;
import com.deutschbridge.backend.repository.NotificationTemplateRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationTemplateServiceTest {

    @Mock
    private NotificationTemplateRepository repository;

    @InjectMocks
    private NotificationTemplateService service;

    private static final Map<String, String> PARAMS = Map.of("count", "8", "minutes", "5");

    @Test
    @DisplayName("localization -> German, English and Persian render from the same template key")
    void rendersAllThreeLanguages() {
        when(repository.findByTemplateKeyAndLanguage(anyString(), anyString())).thenReturn(Optional.empty());

        NotificationTemplateService.Rendered de = service.render("REVIEW_DUE", "de", PARAMS);
        NotificationTemplateService.Rendered en = service.render("REVIEW_DUE", "en", PARAMS);
        NotificationTemplateService.Rendered fa = service.render("REVIEW_DUE", "fa", PARAMS);

        assertEquals("🔄 8 Wörter warten auf dich", de.title());
        assertEquals("Deine Wiederholung dauert etwa 5 Minuten.", de.body());
        assertEquals("🔄 8 words are waiting for you", en.title());
        assertTrue(fa.title().contains("8") && fa.title().contains("واژه"));
        assertFalse(fa.body().contains("{{"));
    }

    @Test
    @DisplayName("admin-edited template in the database wins over the built-in default")
    void storedTemplateOverridesDefault() {
        when(repository.findByTemplateKeyAndLanguage("REVIEW_DUE", "en"))
                .thenReturn(Optional.of(new NotificationTemplate("REVIEW_DUE:en", "REVIEW_DUE", "en",
                        "Review {{count}} words", "About {{minutes}} min", null)));

        NotificationTemplateService.Rendered en = service.render("REVIEW_DUE", "en", PARAMS);

        assertEquals("Review 8 words", en.title());
        assertEquals("About 5 min", en.body());
    }

    @Test
    @DisplayName("missing language row falls back to English")
    void fallsBackToEnglish() {
        when(repository.findByTemplateKeyAndLanguage("REVIEW_DUE", "fa")).thenReturn(Optional.empty());
        when(repository.findByTemplateKeyAndLanguage("REVIEW_DUE", "en"))
                .thenReturn(Optional.of(new NotificationTemplate("REVIEW_DUE:en", "REVIEW_DUE", "en", "EN {{count}}", "", null)));

        assertEquals("EN 8", service.render("REVIEW_DUE", "fa", PARAMS).title());
    }

    @Test
    @DisplayName("unknown placeholders render empty instead of leaking {{braces}}")
    void unknownPlaceholders() {
        assertEquals("Hi !", NotificationTemplateService.fill("Hi {{ name }}!", Map.of()));
    }

    @Test
    @DisplayName("learner language -> PR maps to fa, DE to de, EN/none to en")
    void languageForUser() {
        assertEquals("fa", NotificationTemplateService.languageFor(userWith(PreferredLanguage.PR)));
        assertEquals("de", NotificationTemplateService.languageFor(userWith(PreferredLanguage.DE)));
        assertEquals("en", NotificationTemplateService.languageFor(userWith(PreferredLanguage.EN)));
        assertEquals("en", NotificationTemplateService.languageFor(new User()));
    }

    private static User userWith(PreferredLanguage language) {
        User user = new User();
        UserProfile profile = new UserProfile();
        profile.setPreferredLanguage(language);
        user.setProfile(profile);
        return user;
    }
}
