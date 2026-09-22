package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.Expression;
import com.deutschbridge.backend.model.entity.ExpressionExample;
import com.deutschbridge.backend.model.entity.ExpressionPattern;
import com.deutschbridge.backend.model.entity.ExpressionQuestion;
import com.deutschbridge.backend.model.entity.ExpressionQuestionOption;
import com.deutschbridge.backend.model.enums.ExpressionExampleContext;
import com.deutschbridge.backend.model.enums.ExpressionQuestionFormat;
import com.deutschbridge.backend.model.enums.ExpressionQuestionType;
import com.deutschbridge.backend.model.enums.ExpressionRegister;
import com.deutschbridge.backend.model.enums.ExpressionStatus;
import com.deutschbridge.backend.model.enums.ExpressionType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.ExpressionRepository;
import org.slf4j.Logger;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ExpressionSeeder {

    private final Logger log;

    public ExpressionSeeder(Logger log) {
        this.log = log;
    }

    @Bean
    public CommandLineRunner seedExpressions(ExpressionRepository repository) {
        return args -> {
            if (repository.count() > 0) return;

            List<Expression> expressions = List.of(
                    nomenVerbVerbindung(
                            "eine Entscheidung treffen",
                            LearningLevel.B2,
                            "sich entscheiden",
                            "to make a decision",
                            "تصمیم گرفتن",
                            "Akkusativ",
                            "Formal and neutral expression, common in written German.",
                            ExpressionRegister.NEUTRAL_FORMAL,
                            "Learners often say \"eine Entscheidung machen\" (calqued from English) instead of \"treffen\".",
                            List.of(
                                    example("Ich muss heute eine Entscheidung treffen.", "I have to make a decision today.", "امروز باید تصمیم بگیرم.", ExpressionExampleContext.EVERYDAY),
                                    example("Die Regierung hat eine wichtige Entscheidung getroffen.", "The government has made an important decision.", "دولت تصمیم مهمی گرفته است.", ExpressionExampleContext.SOCIETY),
                                    example("Nach langen Diskussionen traf der Vorstand eine Entscheidung über die Fusion.", "After long discussions the board made a decision about the merger.", "پس از بحث‌های طولانی، هیئت مدیره درباره ادغام تصمیم گرفت.", ExpressionExampleContext.WORK)
                            ),
                            List.of(
                                    pattern("eine Entscheidung über + Akkusativ treffen", "Akkusativ", "über", "Wir treffen eine Entscheidung über den neuen Standort."),
                                    pattern("eine Entscheidung für + Akkusativ treffen", "Akkusativ", "für", "Sie hat sich für eine Entscheidung für das billigere Angebot entschieden."),
                                    pattern("eine Entscheidung gegen + Akkusativ treffen", "Akkusativ", "gegen", "Das Gericht traf eine Entscheidung gegen den Angeklagten.")
                            ),
                            List.of(
                                    contextQuestion(
                                            "Welche Situation passt zu \"eine Entscheidung treffen\"?",
                                            "Richtig, weil hier jemand zwischen zwei Optionen wählen muss.",
                                            List.of(
                                                    option("Ich weiß nicht, ob ich den neuen Job annehmen soll.", true),
                                                    option("Ich habe gestern drei Äpfel gekauft.", false),
                                                    option("Der Zug fährt um 10 Uhr.", false)
                                            )
                                    ),
                                    completionQuestion(
                                            "Nach langen Diskussionen hat die Regierung ________.",
                                            "\"treffen\" ist das richtige Verb für diese Nomen-Verb-Verbindung, nicht \"machen\" oder \"tun\".",
                                            List.of(
                                                    option("eine Entscheidung getroffen", true),
                                                    option("eine Entscheidung gemacht", false),
                                                    option("eine Entscheidung getan", false)
                                            )
                                    ),
                                    transformationQuestionMcq(
                                            "Die Regierung muss entscheiden, ob sie das Projekt unterstützt.",
                                            "Die Umformulierung nutzt die feste Wendung, statt das Verb \"entscheiden\" allein zu verwenden.",
                                            List.of(
                                                    option("Die Regierung muss eine Entscheidung darüber treffen, ob sie das Projekt unterstützt.", true),
                                                    option("Die Regierung muss eine Entscheidung machen über das Projekt.", false),
                                                    option("Die Regierung entscheidet das Projekt.", false)
                                            )
                                    )
                            )
                    ),
                    nomenVerbVerbindung(
                            "Kritik üben",
                            LearningLevel.B2,
                            "etwas kritisieren",
                            "to criticize / voice criticism",
                            "انتقاد کردن",
                            "Akkusativ (an + Dativ für das Objekt der Kritik)",
                            "More formal than the verb \"kritisieren\" alone; common in journalism and formal writing.",
                            ExpressionRegister.NEUTRAL_FORMAL,
                            "Learners forget the preposition and say \"Kritik über\" instead of \"Kritik an + Dativ\".",
                            List.of(
                                    example("Die Opposition übt scharfe Kritik an der Regierung.", "The opposition voices sharp criticism of the government.", "اپوزیسیون از دولت به‌شدت انتقاد می‌کند.", ExpressionExampleContext.SOCIETY),
                                    example("Mein Chef übte Kritik an meiner Präsentation.", "My boss criticized my presentation.", "رئیسم از ارائه‌ی من انتقاد کرد.", ExpressionExampleContext.WORK),
                                    example("In der Prüfung sollst du konstruktiv Kritik üben.", "In the exam you should give constructive criticism.", "در امتحان باید انتقاد سازنده مطرح کنی.", ExpressionExampleContext.EXAM)
                            ),
                            List.of(
                                    pattern("Kritik an + Dativ üben", "Dativ", "an", "Er übt Kritik an dem neuen Gesetz.")
                            ),
                            List.of(
                                    completionQuestion(
                                            "Die Presse ________ scharfe Kritik ________ dem Minister.",
                                            "Die Präposition nach \"Kritik üben\" ist immer \"an + Dativ\".",
                                            List.of(
                                                    option("übt / an", true),
                                                    option("macht / über", false),
                                                    option("übt / über", false)
                                            )
                                    )
                            )
                    ),
                    redewendung(
                            "ins kalte Wasser springen",
                            LearningLevel.B2,
                            "etwas Neues beginnen, obwohl man wenig Erfahrung hat",
                            "to jump in at the deep end",
                            "بدون آمادگی وارد یک موقعیت جدید شدن",
                            "in kaltes Wasser springen",
                            "eine schwierige oder neue Situation direkt angehen",
                            "Wird meist im Perfekt oder als Infinitivkonstruktion mit \"müssen\" verwendet.",
                            ExpressionRegister.UMGANGSSPRACHLICH,
                            "Nicht wörtlich übersetzen - es geht nicht um echtes Wasser, sondern um eine neue, unvorbereitete Situation.",
                            List.of(
                                    example("Am ersten Arbeitstag musste ich gleich ins kalte Wasser springen.", "On my first day at work I had to jump straight in at the deep end.", "در اولین روز کاری‌ام باید بدون آمادگی وارد کار می‌شدم.", ExpressionExampleContext.WORK),
                                    example("Als Neuling an der Uni bin ich einfach ins kalte Wasser gesprungen.", "As a newcomer at university I just jumped in at the deep end.", "به‌عنوان دانشجوی جدید، بدون آمادگی وارد دانشگاه شدم.", ExpressionExampleContext.UNIVERSITY),
                                    example("Man kann nicht immer alles vorbereiten - manchmal muss man ins kalte Wasser springen.", "You can't always prepare everything - sometimes you have to jump in at the deep end.", "همیشه نمی‌شود همه‌چیز را آماده کرد، گاهی باید بدون آمادگی شروع کرد.", ExpressionExampleContext.EVERYDAY)
                            ),
                            List.of(),
                            List.of(
                                    contextQuestion(
                                            "Maria beginnt morgen ihren ersten Arbeitstag. Sie kennt das Unternehmen noch nicht und muss sofort ein wichtiges Projekt übernehmen. Welche Redewendung passt?",
                                            "Maria wird direkt, ohne Vorbereitung, in eine neue Situation geworfen - genau das beschreibt \"ins kalte Wasser springen\".",
                                            List.of(
                                                    option("ins kalte Wasser springen", true),
                                                    option("den Faden verlieren", false),
                                                    option("auf dem Holzweg sein", false)
                                            )
                                    ),
                                    transformationQuestionFreeText(
                                            "Ich hatte keine Erfahrung, aber ich musste die Präsentation trotzdem sofort übernehmen."
                                    )
                            )
                    )
            );

            repository.saveAll(expressions);
            log.info("Seeded {} expressions!", expressions.size());
        };
    }

    /**
     * Runs on every boot (unlike seedExpressions, which only fires once against an empty table)
     * so additional expressions can be introduced later without wiping existing data/progress.
     * Checked idempotently by expression text.
     */
    @Bean
    public CommandLineRunner seedAdditionalExpressions(ExpressionRepository repository) {
        return args -> {
            boolean alreadySeeded = repository.findAll().stream()
                    .anyMatch(e -> "den Kopf in den Sand stecken".equals(e.getExpression()));
            if (alreadySeeded) return;

            Expression headInSand = redewendung(
                    "den Kopf in den Sand stecken",
                    LearningLevel.B1,
                    "ein Problem ignorieren",
                    "to bury one's head in the sand",
                    "از مشکل چشم‌پوشی کردن",
                    "den Kopf in den Sand stecken (wie ein Vogel Strauß)",
                    "ein Problem oder eine unangenehme Situation bewusst ignorieren, anstatt sich damit auseinanderzusetzen",
                    "Wird oft im Zusammenhang mit Verantwortung oder unangenehmen Wahrheiten verwendet.",
                    ExpressionRegister.UMGANGSSPRACHLICH,
                    "Nicht wörtlich übersetzen - es geht nicht um echten Sand, sondern um das Vermeiden eines Problems.",
                    List.of(
                            example("Statt das Problem zu lösen, steckt er einfach den Kopf in den Sand.", "Instead of solving the problem, he just buries his head in the sand.", "او به‌جای حل مشکل، فقط از آن چشم‌پوشی می‌کند.", ExpressionExampleContext.EVERYDAY),
                            example("Die Firma kann die sinkenden Umsätze nicht ewig ignorieren und den Kopf in den Sand stecken.", "The company can't ignore the falling sales and bury its head in the sand forever.", "شرکت نمی‌تواند برای همیشه کاهش فروش را نادیده بگیرد.", ExpressionExampleContext.WORK),
                            example("Man sollte bei gesundheitlichen Problemen nicht den Kopf in den Sand stecken.", "You shouldn't bury your head in the sand when it comes to health problems.", "در مورد مشکلات سلامتی نباید چشم‌پوشی کرد.", ExpressionExampleContext.EVERYDAY)
                    ),
                    List.of(),
                    List.of(
                            contextQuestion(
                                    "Ein Kollege weiß, dass sein Projekt scheitern wird, spricht aber mit niemandem darüber und macht einfach weiter wie bisher. Welche Redewendung passt?",
                                    "Er ignoriert das Problem bewusst, anstatt sich damit auseinanderzusetzen - genau das beschreibt \"den Kopf in den Sand stecken\".",
                                    List.of(
                                            option("den Kopf in den Sand stecken", true),
                                            option("ins kalte Wasser springen", false),
                                            option("eine Entscheidung treffen", false)
                                    )
                            )
                    )
            );

            repository.save(headInSand);
            log.info("Seeded additional expression: {}", headInSand.getExpression());
        };
    }

    private static Expression nomenVerbVerbindung(String expressionText, LearningLevel level, String meaningDe, String meaningEn,
                                                    String meaningFa, String grammarNote, String usageNote, ExpressionRegister register,
                                                    String commonMistakes, List<ExpressionExample> examples, List<ExpressionPattern> patterns,
                                                    List<ExpressionQuestion> questions) {
        Expression e = base(expressionText, ExpressionType.NOMEN_VERB_VERBINDUNG, level, meaningDe, meaningEn, meaningFa, register, usageNote, commonMistakes);
        e.setGrammarNote(grammarNote);
        attach(e, examples, patterns, questions);
        return e;
    }

    private static Expression redewendung(String expressionText, LearningLevel level, String meaningDe, String meaningEn,
                                           String meaningFa, String literalMeaning, String figurativeMeaning, String usageNote,
                                           ExpressionRegister register, String commonMistakes, List<ExpressionExample> examples, List<ExpressionPattern> patterns,
                                           List<ExpressionQuestion> questions) {
        Expression e = base(expressionText, ExpressionType.REDEWENDUNG, level, meaningDe, meaningEn, meaningFa, register, usageNote, commonMistakes);
        e.setLiteralMeaning(literalMeaning);
        e.setFigurativeMeaning(figurativeMeaning);
        attach(e, examples, patterns, questions);
        return e;
    }

    private static Expression base(String expressionText, ExpressionType type, LearningLevel level, String meaningDe,
                                    String meaningEn, String meaningFa, ExpressionRegister register, String usageNote, String commonMistakes) {
        Expression e = new Expression();
        e.setExpression(expressionText);
        e.setType(type);
        e.setLevel(level);
        e.setMeaningDe(meaningDe);
        e.setMeaningEn(meaningEn);
        e.setMeaningFa(meaningFa);
        e.setRegister(register);
        e.setUsageNote(usageNote);
        e.setCommonMistakes(commonMistakes);
        e.setStatus(ExpressionStatus.PUBLISHED);
        return e;
    }

    private static void attach(Expression e, List<ExpressionExample> examples, List<ExpressionPattern> patterns, List<ExpressionQuestion> questions) {
        for (ExpressionExample example : examples) {
            example.setExpression(e);
            e.getExamples().add(example);
        }
        for (ExpressionPattern pattern : patterns) {
            pattern.setExpression(e);
            e.getPatterns().add(pattern);
        }
        for (ExpressionQuestion question : questions) {
            question.setExpression(e);
            for (ExpressionQuestionOption option : question.getOptions()) {
                option.setQuestion(question);
            }
            e.getQuestions().add(question);
        }
    }

    private static ExpressionExample example(String sentence, String translationEn, String translationFa, ExpressionExampleContext context) {
        ExpressionExample ex = new ExpressionExample();
        ex.setSentence(sentence);
        ex.setTranslationEn(translationEn);
        ex.setTranslationFa(translationFa);
        ex.setContext(context);
        return ex;
    }

    private static ExpressionPattern pattern(String pattern, String grammarCase, String preposition, String example) {
        ExpressionPattern p = new ExpressionPattern();
        p.setPattern(pattern);
        p.setGrammarCase(grammarCase);
        p.setPreposition(preposition);
        p.setExample(example);
        return p;
    }

    private static ExpressionQuestion contextQuestion(String prompt, String explanation, List<ExpressionQuestionOption> options) {
        return question(ExpressionQuestionType.CONTEXT, ExpressionQuestionFormat.MULTIPLE_CHOICE, prompt, explanation, options);
    }

    private static ExpressionQuestion completionQuestion(String prompt, String explanation, List<ExpressionQuestionOption> options) {
        return question(ExpressionQuestionType.COMPLETION, ExpressionQuestionFormat.MULTIPLE_CHOICE, prompt, explanation, options);
    }

    private static ExpressionQuestion transformationQuestionMcq(String prompt, String explanation, List<ExpressionQuestionOption> options) {
        return question(ExpressionQuestionType.TRANSFORMATION, ExpressionQuestionFormat.MULTIPLE_CHOICE, prompt, explanation, options);
    }

    private static ExpressionQuestion transformationQuestionFreeText(String sourceSentence) {
        return question(ExpressionQuestionType.TRANSFORMATION, ExpressionQuestionFormat.FREE_TEXT, sourceSentence, null, List.of());
    }

    private static ExpressionQuestion question(ExpressionQuestionType type, ExpressionQuestionFormat format, String prompt,
                                                 String explanation, List<ExpressionQuestionOption> options) {
        ExpressionQuestion q = new ExpressionQuestion();
        q.setType(type);
        q.setFormat(format);
        q.setPrompt(prompt);
        q.setExplanation(explanation);
        q.getOptions().addAll(options);
        return q;
    }

    private static ExpressionQuestionOption option(String text, boolean correct) {
        ExpressionQuestionOption o = new ExpressionQuestionOption();
        o.setText(text);
        o.setCorrect(correct);
        return o;
    }
}
