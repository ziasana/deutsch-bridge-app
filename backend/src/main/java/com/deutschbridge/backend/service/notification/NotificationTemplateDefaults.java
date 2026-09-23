package com.deutschbridge.backend.service.notification;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Factory copy for every notification template, seeded into the notification_templates table on
 * startup (existing rows - i.e. admin edits - are never overwritten). Business logic never contains
 * notification text; it only picks a template key and supplies {{placeholder}} values.
 */
public final class NotificationTemplateDefaults {

    public static final List<String> LANGUAGES = List.of("de", "en", "fa");

    public record Copy(String title, String body) {
    }

    /** templateKey -> language -> copy. Insertion-ordered so the admin UI lists templates predictably. */
    public static final Map<String, Map<String, Copy>> TEMPLATES = new LinkedHashMap<>();

    static {
        put("REVIEW_DUE",
                new Copy("🔄 {{count}} Wörter warten auf dich", "Deine Wiederholung dauert etwa {{minutes}} Minuten."),
                new Copy("🔄 {{count}} words are waiting for you", "Your review takes about {{minutes}} minutes."),
                new Copy("🔄 {{count}} واژه منتظر مرور شماست", "مرور شما حدود {{minutes}} دقیقه طول می‌کشد."));

        put("DAILY_WORDS_READY",
                new Copy("📚 Deine {{count}} Wörter für heute sind bereit", "Starte deine heutige Lerneinheit."),
                new Copy("📚 Your {{count}} words for today are ready", "Start today's learning session."),
                new Copy("📚 {{count}} واژهٔ امروز شما آماده است", "جلسهٔ یادگیری امروز را شروع کنید."));

        put("DAILY_PLAN_INCOMPLETE",
                new Copy("📚 Deine heutige Lerneinheit wartet", "Du hast {{completed}} von {{total}} Aktivitäten abgeschlossen."),
                new Copy("📚 Today's learning plan is waiting", "You've completed {{completed}} of {{total}} activities."),
                new Copy("📚 برنامهٔ یادگیری امروز منتظر شماست", "شما {{completed}} از {{total}} فعالیت را انجام داده‌اید."));

        put("CONTINUE_LEARNING.READING",
                new Copy("📖 Du kannst hier weitermachen", "Lesen: „{{title}}“"),
                new Copy("📖 Pick up where you left off", "Reading: “{{title}}”"),
                new Copy("📖 از همان جایی که ماندید ادامه دهید", "خواندن: «{{title}}»"));

        put("CONTINUE_LEARNING.EXAM",
                new Copy("📖 Du kannst hier weitermachen", "Prüfungsvorbereitung: „{{title}}“"),
                new Copy("📖 Pick up where you left off", "Exam practice: “{{title}}”"),
                new Copy("📖 از همان جایی که ماندید ادامه دهید", "آمادگی آزمون: «{{title}}»"));

        put("MILESTONE_REACHED.WORDS",
                new Copy("🎉 {{value}} Wörter gelernt!", "Du hast einen neuen Lernmeilenstein erreicht."),
                new Copy("🎉 {{value}} words learned!", "You've reached a new learning milestone."),
                new Copy("🎉 {{value}} واژه یاد گرفتید!", "به یک نقطهٔ عطف تازه در یادگیری رسیدید."));

        put("MILESTONE_REACHED.GRAMMAR",
                new Copy("🎉 {{value}} Grammatiklektionen abgeschlossen!", "Du hast einen neuen Lernmeilenstein erreicht."),
                new Copy("🎉 {{value}} grammar lessons completed!", "You've reached a new learning milestone."),
                new Copy("🎉 {{value}} درس دستور زبان را تمام کردید!", "به یک نقطهٔ عطف تازه در یادگیری رسیدید."));

        put("MILESTONE_REACHED.READING",
                new Copy("🎉 {{value}} Lesetexte gelesen!", "Du hast einen neuen Lernmeilenstein erreicht."),
                new Copy("🎉 {{value}} reading texts completed!", "You've reached a new learning milestone."),
                new Copy("🎉 {{value}} متن خواندنی را تمام کردید!", "به یک نقطهٔ عطف تازه در یادگیری رسیدید."));

        put("MILESTONE_REACHED.STREAK",
                new Copy("🔥 {{value}} Lerntage in Folge!", "Bleib dran – du machst das großartig."),
                new Copy("🔥 {{value}}-day learning streak!", "Keep it up — you're doing great."),
                new Copy("🔥 {{value}} روز پیاپی یادگیری!", "ادامه دهید — عالی پیش می‌روید."));
    }

    private NotificationTemplateDefaults() {
    }

    private static void put(String key, Copy de, Copy en, Copy fa) {
        Map<String, Copy> byLanguage = new LinkedHashMap<>();
        byLanguage.put("de", de);
        byLanguage.put("en", en);
        byLanguage.put("fa", fa);
        TEMPLATES.put(key, byLanguage);
    }
}
