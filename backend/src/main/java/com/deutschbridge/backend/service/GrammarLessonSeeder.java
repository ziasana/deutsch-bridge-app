package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.GrammarLesson;
import com.deutschbridge.backend.model.entity.QuizQuestion;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.GrammarLessonRepository;
import org.slf4j.Logger;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class GrammarLessonSeeder {

    private final Logger log;

    public GrammarLessonSeeder(Logger log) {
        this.log = log;
    }

    @Bean
    public CommandLineRunner seedGrammarLessons(GrammarLessonRepository repository) {
        return args -> {
            if (repository.count() > 0) return;

            List<GrammarLesson> lessons = List.of(
                    lesson(
                            "Konjunktiv II",
                            "The subjunctive mood used for hypotheticals, polite requests, and wishes.",
                            "Konjunktiv II is formed with würde + infinitive for most verbs, or the special forms (wäre, hätte, könnte) for common irregular verbs. It expresses things that are unreal, hypothetical, or polite.",
                            "Wenn ich Zeit hätte, würde ich dich besuchen. (If I had time, I would visit you.)",
                            "Use 'würde' + infinitive as the default; irregular verbs like sein, haben, können keep their own Konjunktiv II forms (wäre, hätte, könnte).",
                            LearningLevel.B2,
                            List.of(
                                    mcq("Hypothetical wish", "Wenn ich reich ___, würde ich reisen.", List.of("bin", "wäre", "war", "sein"), "wäre"),
                                    fill("Polite request", "___ Sie mir bitte helfen? (Könnten)", "Könnten"),
                                    truefalse("Formation", "Konjunktiv II always uses 'würde' + infinitive, with no exceptions.", false)
                            )
                    ),
                    lesson(
                            "Passiv (Passive Voice)",
                            "How to form and use the passive voice in German.",
                            "The passive voice ('werden' + past participle) shifts focus from the doer of an action to the action itself or its recipient. The agent can optionally be introduced with 'von' (person) or 'durch' (cause/means).",
                            "Das Haus wird von der Firma gebaut. (The house is being built by the company.)",
                            "Vorgangspassiv uses 'werden'; Zustandspassiv (a resulting state) uses 'sein' + past participle instead.",
                            LearningLevel.B2,
                            List.of(
                                    mcq("Passive auxiliary", "Der Brief ___ gestern geschrieben.", List.of("hat", "wurde", "ist", "war"), "wurde"),
                                    fill("Agent with von", "Das Buch wurde ___ dem Autor signiert. (von)", "von"),
                                    truefalse("Zustandspassiv", "Zustandspassiv describes an ongoing action, not a resulting state.", false)
                            )
                    ),
                    lesson(
                            "Relativsätze (Relative Clauses)",
                            "Connecting clauses with relative pronouns that agree in gender, number, and case.",
                            "Relative pronouns (der, die, das, etc.) refer back to a noun and take their case from their role inside the relative clause, not from the main clause.",
                            "Der Mann, der dort steht, ist mein Lehrer. (The man who is standing there is my teacher.)",
                            "Always send the finite verb to the end of the relative clause, and match the pronoun's gender/number to its antecedent.",
                            LearningLevel.B1,
                            List.of(
                                    mcq("Correct pronoun", "Die Frau, ___ ich gestern getroffen habe, ist Ärztin.", List.of("die", "der", "das", "den"), "die"),
                                    fill("Verb position", "Der Film, den wir gesehen ___, war spannend. (haben)", "haben"),
                                    truefalse("Case rule", "The relative pronoun's case depends only on the main clause.", false)
                            )
                    ),
                    lesson(
                            "Nebensätze mit weil, dass, obwohl",
                            "Subordinate clauses and verb-final word order.",
                            "Conjunctions like 'weil', 'dass', and 'obwohl' introduce subordinate clauses where the conjugated verb moves to the end of the clause.",
                            "Ich bleibe zu Hause, weil ich krank bin. (I'm staying home because I'm sick.)",
                            "Don't confuse 'weil' (because, verb-final) with 'denn' (because, verb stays in second position).",
                            LearningLevel.A2,
                            List.of(
                                    mcq("Verb position", "Er sagt, dass er morgen ___.", List.of("kommt", "kommt er", "er kommt", "kommen"), "kommt"),
                                    fill("Concession", "___ es regnet, gehen wir spazieren. (Obwohl)", "Obwohl"),
                                    truefalse("Weil vs denn", "With 'weil', the conjugated verb goes to the end of the clause.", true)
                            )
                    ),
                    lesson(
                            "Präpositionen mit Dativ und Akkusativ",
                            "Two-way prepositions that take dative or accusative depending on motion vs. location.",
                            "Prepositions like 'in', 'an', 'auf', 'unter' take the accusative for movement toward a place (wohin?) and the dative for a fixed location (wo?).",
                            "Ich lege das Buch auf den Tisch. (accusative, movement) / Das Buch liegt auf dem Tisch. (dative, location)",
                            "Ask 'wohin?' for accusative (motion) and 'wo?' for dative (position) to decide the case.",
                            LearningLevel.A2,
                            List.of(
                                    mcq("Wohin or wo", "Ich gehe in ___ Schule. (die)", List.of("die", "der", "dem", "den"), "die"),
                                    fill("Location", "Die Katze schläft auf ___ Sofa. (dem)", "dem"),
                                    truefalse("Rule", "Two-way prepositions always take the dative case.", false)
                            )
                    )
            );

            repository.saveAll(lessons);
            log.info("Seeded {} grammar lessons!", lessons.size());
        };
    }

    private static GrammarLesson lesson(String title, String summary, String content, String example, String usageTips, LearningLevel level, List<QuizQuestion> quiz) {
        GrammarLesson lesson = new GrammarLesson();
        lesson.setTitle(title);
        lesson.setSummary(summary);
        lesson.setContent(content);
        lesson.setExample(example);
        lesson.setUsageTips(usageTips);
        lesson.setLevel(level);
        lesson.setQuiz(quiz);
        return lesson;
    }

    private static QuizQuestion mcq(String title, String question, List<String> options, String answer) {
        return new QuizQuestion("mcq", title, question, options, answer);
    }

    private static QuizQuestion fill(String title, String question, String answer) {
        return new QuizQuestion("fill", title, question, null, answer);
    }

    private static QuizQuestion truefalse(String title, String question, boolean answer) {
        return new QuizQuestion("truefalse", title, question, null, answer);
    }
}
