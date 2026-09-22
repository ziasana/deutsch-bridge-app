package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.DailyWord;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.DailyWordRepository;
import org.slf4j.Logger;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DailyWordSeeder {

    private final Logger log;

    public DailyWordSeeder(Logger log) {
        this.log = log;
    }

    @Bean
    public CommandLineRunner seedDailyWords(DailyWordRepository repository) {
        return args -> {
            if (repository.count() > 0) return;

            List<DailyWord> words = List.of(
                    word("die Verhältnismäßigkeit", "proportionality", "Das Gericht prüfte die Verhältnismäßigkeit der Maßnahme.", "Angemessenheit, Ausgewogenheit", LearningLevel.C1),
                    word("nachvollziehen", "to comprehend / trace", "Ich kann seine Entscheidung gut nachvollziehen.", "verstehen, begreifen", LearningLevel.C1),
                    word("die Auseinandersetzung", "confrontation / debate", "Die Auseinandersetzung mit dem Thema dauerte Stunden.", "Diskussion, Konflikt", LearningLevel.C1),
                    word("gewährleisten", "to ensure / guarantee", "Die Firma muss die Sicherheit der Mitarbeiter gewährleisten.", "sicherstellen, garantieren", LearningLevel.C1),
                    word("die Voraussetzung", "prerequisite", "Gute Deutschkenntnisse sind eine Voraussetzung für den Job.", "Bedingung, Grundlage", LearningLevel.B2),
                    word("berücksichtigen", "to take into account", "Wir müssen alle Faktoren berücksichtigen.", "beachten, einbeziehen", LearningLevel.B2),
                    word("die Beeinträchtigung", "impairment", "Der Lärm führte zu einer Beeinträchtigung der Konzentration.", "Störung, Einschränkung", LearningLevel.C1),
                    word("zurückzuführen sein auf", "to be attributable to", "Der Fehler ist auf eine falsche Konfiguration zurückzuführen.", "verursacht werden durch", LearningLevel.C1),
                    word("die Erkenntnis", "insight / realization", "Diese Erkenntnis veränderte seine Sichtweise.", "Einsicht, Verständnis", LearningLevel.B2),
                    word("sich auszeichnen durch", "to be distinguished by", "Das Produkt zeichnet sich durch hohe Qualität aus.", "sich hervorheben durch", LearningLevel.C1),
                    word("die Tragweite", "scope / significance", "Die Tragweite der Entscheidung war allen bewusst.", "Bedeutung, Ausmaß", LearningLevel.C1),
                    word("unabdingbar", "indispensable", "Ein gutes Team ist unabdingbar für den Erfolg.", "notwendig, unverzichtbar", LearningLevel.C1),
                    word("die Diskrepanz", "discrepancy", "Es gibt eine Diskrepanz zwischen Theorie und Praxis.", "Unstimmigkeit, Widerspruch", LearningLevel.C1),
                    word("einleuchten", "to make sense", "Seine Argumentation leuchtet mir ein.", "verständlich sein, überzeugen", LearningLevel.B2),
                    word("die Bewandtnis", "the reason / circumstance", "Damit hat es eine besondere Bewandtnis.", "Hintergrund, Grund", LearningLevel.C2),

                    // A1-A2: fallback pool used when AI generation is unavailable for lower-level
                    // learners, with Persian translations for learners whose profile language is PR.
                    wordFa("das Haus", "house", "Mein Haus ist sehr groß.", "die Wohnung, das Gebäude", LearningLevel.A1, "خانه", "خانه من خیلی بزرگ است."),
                    wordFa("essen", "to eat", "Ich esse jeden Morgen ein Brot.", "speisen", LearningLevel.A1, "خوردن", "من هر صبح یک نان می‌خورم."),
                    wordFa("die Familie", "family", "Meine Familie wohnt in Berlin.", "die Verwandtschaft", LearningLevel.A1, "خانواده", "خانواده من در برلین زندگی می‌کند."),
                    wordFa("der Freund", "friend", "Er ist mein bester Freund.", "der Kumpel", LearningLevel.A1, "دوست", "او بهترین دوست من است."),
                    wordFa("arbeiten", "to work", "Sie arbeitet in einem Büro.", "tätig sein", LearningLevel.A2, "کار کردن", "او در یک اداره کار می‌کند."),
                    wordFa("das Wetter", "weather", "Das Wetter ist heute schön.", "die Witterung", LearningLevel.A2, "هوا", "امروز هوا خوب است."),
                    wordFa("einkaufen", "to go shopping", "Wir gehen am Samstag einkaufen.", "shoppen", LearningLevel.A2, "خرید کردن", "ما شنبه به خرید می‌رویم."),
                    wordFa("die Reise", "trip / journey", "Die Reise nach Italien war wunderschön.", "die Fahrt, der Ausflug", LearningLevel.A2, "سفر", "سفر به ایتالیا فوق‌العاده بود."),

                    // B1: fallback pool only - no Persian, matching PERSIAN_ELIGIBLE_LEVELS in DailyWordService.
                    word("sich erinnern", "to remember", "Ich kann mich gut an meine Kindheit erinnern.", "im Gedächtnis behalten", LearningLevel.B1),
                    word("die Erfahrung", "experience", "Er hat viel Erfahrung in diesem Bereich.", "die Praxis, das Wissen", LearningLevel.B1),
                    word("sich entspannen", "to relax", "Am Wochenende entspanne ich mich zu Hause.", "sich erholen", LearningLevel.B1),
                    word("die Verantwortung", "responsibility", "Sie übernimmt die Verantwortung für das Projekt.", "die Pflicht", LearningLevel.B1)
            );

            repository.saveAll(words);
            log.info("Seeded {} daily words!", words.size());
        };
    }

    private static DailyWord word(String word, String meaning, String example, String synonyms, LearningLevel level) {
        DailyWord w = new DailyWord();
        w.setWord(word);
        w.setMeaning(meaning);
        w.setExample(example);
        w.setSynonyms(synonyms);
        w.setLevel(level);
        return w;
    }

    private static DailyWord wordFa(String word, String meaning, String example, String synonyms, LearningLevel level,
                                     String meaningFa, String exampleFa) {
        DailyWord w = word(word, meaning, example, synonyms, level);
        w.setMeaningFa(meaningFa);
        w.setExampleFa(exampleFa);
        return w;
    }
}
