package com.deutschbridge.backend.service.notification;

import com.deutschbridge.backend.model.dto.NotificationTemplateDto;
import com.deutschbridge.backend.model.entity.NotificationTemplate;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.PreferredLanguage;
import com.deutschbridge.backend.repository.NotificationTemplateRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Renders localized notification copy from {{placeholder}} templates. One code path serves every
 * language: the learner's preferred language picks the template row (EN -> en, DE -> de, PR -> fa),
 * falling back to English and finally to the built-in defaults.
 */
@Service
public class NotificationTemplateService {

    private static final Pattern PLACEHOLDER = Pattern.compile("\\{\\{\\s*(\\w+)\\s*}}");
    private static final String FALLBACK_LANGUAGE = "en";

    public record Rendered(String title, String body) {
    }

    private final NotificationTemplateRepository templateRepository;

    public NotificationTemplateService(NotificationTemplateRepository templateRepository) {
        this.templateRepository = templateRepository;
    }

    @PostConstruct
    public void seedDefaults() {
        List<NotificationTemplate> missing = new ArrayList<>();
        NotificationTemplateDefaults.TEMPLATES.forEach((key, byLanguage) -> byLanguage.forEach((language, copy) -> {
            if (templateRepository.findByTemplateKeyAndLanguage(key, language).isEmpty()) {
                missing.add(new NotificationTemplate(null, key, language, copy.title(), copy.body(), null));
            }
        }));
        if (!missing.isEmpty()) templateRepository.saveAll(missing);
    }

    public static String languageFor(User user) {
        PreferredLanguage preferred = user.getProfile() != null ? user.getProfile().getPreferredLanguage() : null;
        if (preferred == null) return FALLBACK_LANGUAGE;
        return switch (preferred) {
            case PR -> "fa";
            case DE -> "de";
            case EN -> "en";
        };
    }

    public Rendered render(String templateKey, String language, Map<String, String> params) {
        NotificationTemplateDefaults.Copy copy = resolve(templateKey, language);
        return new Rendered(fill(copy.title(), params), fill(copy.body(), params));
    }

    public List<NotificationTemplateDto> findAll() {
        return templateRepository.findAllByOrderByTemplateKeyAscLanguageAsc().stream()
                .map(NotificationTemplateService::toDto)
                .toList();
    }

    @Transactional
    public List<NotificationTemplateDto> update(List<NotificationTemplateDto> updates) {
        for (NotificationTemplateDto update : updates) {
            if (update.title() == null || update.title().isBlank()) {
                throw new IllegalArgumentException("Template title cannot be empty: " + update.templateKey() + "/" + update.language());
            }
            NotificationTemplate template = templateRepository
                    .findByTemplateKeyAndLanguage(update.templateKey(), update.language())
                    .orElseThrow(() -> new IllegalArgumentException("Unknown template: " + update.templateKey() + "/" + update.language()));
            template.setTitle(update.title().strip());
            template.setBody(update.body() != null ? update.body().strip() : null);
            templateRepository.save(template);
        }
        return findAll();
    }

    static String fill(String template, Map<String, String> params) {
        if (template == null) return null;
        Matcher matcher = PLACEHOLDER.matcher(template);
        StringBuilder out = new StringBuilder();
        while (matcher.find()) {
            String value = params != null ? params.getOrDefault(matcher.group(1), "") : "";
            matcher.appendReplacement(out, Matcher.quoteReplacement(value));
        }
        matcher.appendTail(out);
        return out.toString();
    }

    private NotificationTemplateDefaults.Copy resolve(String templateKey, String language) {
        Optional<NotificationTemplate> stored = templateRepository.findByTemplateKeyAndLanguage(templateKey, language)
                .or(() -> templateRepository.findByTemplateKeyAndLanguage(templateKey, FALLBACK_LANGUAGE));
        if (stored.isPresent()) {
            return new NotificationTemplateDefaults.Copy(stored.get().getTitle(), stored.get().getBody());
        }
        Map<String, NotificationTemplateDefaults.Copy> defaults = NotificationTemplateDefaults.TEMPLATES.get(templateKey);
        if (defaults == null) {
            throw new IllegalStateException("No notification template for key " + templateKey);
        }
        return defaults.getOrDefault(language, defaults.get(FALLBACK_LANGUAGE));
    }

    private static NotificationTemplateDto toDto(NotificationTemplate t) {
        NotificationTemplateDefaults.Copy defaults = Optional
                .ofNullable(NotificationTemplateDefaults.TEMPLATES.get(t.getTemplateKey()))
                .map(m -> m.get(t.getLanguage()))
                .orElse(null);
        Set<String> placeholders = new LinkedHashSet<>();
        for (String text : new String[]{
                defaults != null ? defaults.title() : t.getTitle(),
                defaults != null ? defaults.body() : t.getBody()}) {
            if (text == null) continue;
            Matcher m = PLACEHOLDER.matcher(text);
            while (m.find()) placeholders.add(m.group(1));
        }
        return new NotificationTemplateDto(t.getTemplateKey(), t.getLanguage(), t.getTitle(), t.getBody(),
                List.copyOf(placeholders),
                defaults != null ? defaults.title() : null,
                defaults != null ? defaults.body() : null);
    }
}
