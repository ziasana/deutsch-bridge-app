package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.model.dto.ExamContentDtos.ExercisePreview;
import com.deutschbridge.backend.model.dto.ExamContentDtos.HeadingView;
import com.deutschbridge.backend.model.dto.ExamContentDtos.AdvertisementView;
import com.deutschbridge.backend.model.dto.ExamContentDtos.ContextView;
import com.deutschbridge.backend.model.dto.ExamContentDtos.QuestionView;
import com.deutschbridge.backend.model.dto.ExamContentDtos.SituationView;
import com.deutschbridge.backend.model.dto.ExamContentDtos.TextView;
import com.deutschbridge.backend.model.dto.ExamContentDtos.SpeakingView;
import com.deutschbridge.backend.model.dto.ExamContentDtos.WritingView;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.ExamPassage;
import com.deutschbridge.backend.model.entity.ExamQuestion;
import com.deutschbridge.backend.model.enums.ExamContentStatus;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.ExamType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.web.util.HtmlUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Converts between the import-file shape (headings + texts + correctHeadingId) and the app's existing
 * exam model: texts become passages, headings the shared answer-option pool, and each text gets one
 * MATCHING question whose correctAnswer is the heading text - exactly how hand-authored Leseverstehen
 * Teil 1 exercises are stored, so imported content plays in the existing learner flow unchanged.
 */
public final class ExamContentMapper {

    private ExamContentMapper() {
    }

    public static ExamExercise toEntity(ParsedExercise ex, ExamType examType, String schemaVersion,
                                        String promptVersion, String hash, String userId) {
        ExamContentSpec spec = ex.spec();
        if (spec.isSpeaking()) {
            return toSpeakingEntity(ex, examType, schemaVersion, promptVersion, hash, userId);
        }
        if (spec.isWriting()) {
            return toWritingEntity(ex, examType, schemaVersion, promptVersion, hash, userId);
        }
        if (spec.isWordBank()) {
            return toWordBankEntity(ex, examType, schemaVersion, promptVersion, hash, userId);
        }
        if (spec.isSituationMatching()) {
            return toSituationEntity(ex, examType, schemaVersion, promptVersion, hash, userId);
        }
        if (spec.isMultipleChoice()) {
            return toReadingEntity(ex, examType, schemaVersion, promptVersion, hash, userId);
        }
        Map<String, String> headingTextById = new LinkedHashMap<>();
        ex.headings().forEach(h -> headingTextById.put(h.id(), h.text()));

        List<ExamPassage> passages = new ArrayList<>();
        List<ExamQuestion> questions = new ArrayList<>();
        for (int i = 0; i < ex.texts().size(); i++) {
            ParsedExercise.Text text = ex.texts().get(i);
            passages.add(new ExamPassage(null, "Text " + (i + 1), toHtml(text.content()), null, null, null).ensureId());
            questions.add(new ExamQuestion(null, ExamTaskType.MATCHING, "Welche Überschrift passt zu Text " + (i + 1) + "?",
                    i, null, headingTextById.get(text.correctHeadingId()), null, i + 1, null, null).ensureId());
        }

        ExamExercise exercise = new ExamExercise();
        exercise.setTitle(ex.title());
        exercise.setExamType(examType);
        exercise.setSection(spec.section());
        exercise.setTaskType(spec.taskType());
        exercise.setLevel(spec.level());
        exercise.setPartNumber(spec.part());
        exercise.setPassages(passages);
        exercise.setQuestions(questions);
        exercise.setAnswerOptions(ex.headings().stream().map(ParsedExercise.Heading::text).toList());
        exercise.setAnswerOptionLabels(ex.headings().stream().map(ParsedExercise.Heading::id).toList());
        exercise.setTeilDescription(ex.instructions());
        exercise.setExternalId(ex.externalId());
        exercise.setSchemaVersion(schemaVersion);
        exercise.setPromptVersion(promptVersion);
        exercise.setMetadata(ex.metadata().isEmpty() ? null : new LinkedHashMap<>(ex.metadata()));
        exercise.setContentHash(hash);
        exercise.setCreatedBy(userId);
        exercise.setUpdatedBy(userId);
        exercise.applyStatus(ExamContentStatus.DRAFT);
        return exercise;
    }

    /**
     * Lesen Teil 2: one passage and one MULTIPLE_CHOICE question per item, stored the way hand-authored
     * multiple-choice exercises are (options as plain strings, correctAnswer = the correct option's text).
     * The option ids (a, b, c) are positional, and the declared question types are kept in the metadata.
     */
    private static ExamExercise toReadingEntity(ParsedExercise ex, ExamType examType, String schemaVersion,
                                                String promptVersion, String hash, String userId) {
        ExamContentSpec spec = ex.spec();
        boolean gaps = spec.isGapText();
        List<ExamQuestion> questions = new ArrayList<>();
        List<String> types = new ArrayList<>();
        List<Map<String, Object>> gapInfo = new ArrayList<>();
        for (int i = 0; i < ex.questions().size(); i++) {
            ParsedExercise.Question q = ex.questions().get(i);
            String correct = q.options().stream().filter(o -> o.id().equals(q.correctOptionId()))
                    .map(ParsedExercise.Option::text).findFirst().orElse(null);
            int number = q.number() != null ? q.number() : spec.firstQuestionNumber() + i;
            // A Sprachbausteine question is "Lücke N"; its German explanation is shown after answering.
            String prompt = q.question() != null ? q.question() : "Lücke " + number;
            ExamQuestion question = new ExamQuestion(null, ExamTaskType.MULTIPLE_CHOICE, prompt, 0,
                    q.options().stream().map(ParsedExercise.Option::text).toList(), correct, gaps ? number : null, number,
                    gaps ? q.explanations().get("de") : null, null).ensureId();
            questions.add(question);
            types.add(q.type() == null ? "" : q.type());
            if (gaps) {
                Map<String, Object> info = new LinkedHashMap<>();
                info.put("number", number);
                if (q.type() != null) info.put("category", q.type());
                if (q.grammarFocus() != null) info.put("grammarFocus", q.grammarFocus());
                Map<String, String> other = new LinkedHashMap<>(q.explanations());
                other.remove("de");
                if (!other.isEmpty()) info.put("explanation", other);
                gapInfo.add(info);
            }
        }
        // Questions are shown to learners sorted by number; keep the stored order consistent with that.
        questions.sort(java.util.Comparator.comparing(ExamQuestion::getQuestionNumber));

        Map<String, Object> metadata = new LinkedHashMap<>(ex.metadata());
        if (gaps) {
            gapInfo.sort(java.util.Comparator.comparing(m -> (Integer) m.get("number")));
            metadata.put("gapQuestions", gapInfo);
        } else if (types.stream().anyMatch(t -> !t.isEmpty())) {
            List<String> ordered = new ArrayList<>(ex.questions().stream()
                    .sorted(java.util.Comparator.comparing(q -> q.number() != null ? q.number() : Integer.MAX_VALUE))
                    .map(q -> q.type() == null ? "" : q.type()).toList());
            metadata.put("questionTypes", ordered);
        }

        ExamExercise exercise = new ExamExercise();
        exercise.setTitle(ex.title());
        exercise.setExamType(examType);
        exercise.setSection(spec.section());
        exercise.setTaskType(spec.taskType());
        exercise.setLevel(spec.level());
        exercise.setPartNumber(spec.part());
        String html = gaps ? toGapHtml(ex.readingText()) : toHtml(ex.readingText());
        exercise.setPassages(new ArrayList<>(List.of(new ExamPassage(null, "Text", html, null, null, null).ensureId())));
        exercise.setQuestions(questions);
        exercise.setTeilDescription(ex.instructions());
        exercise.setExternalId(ex.externalId());
        exercise.setSchemaVersion(schemaVersion);
        exercise.setPromptVersion(promptVersion);
        exercise.setMetadata(metadata.isEmpty() ? null : metadata);
        exercise.setContentHash(hash);
        exercise.setCreatedBy(userId);
        exercise.setUpdatedBy(userId);
        exercise.applyStatus(ExamContentStatus.DRAFT);
        return exercise;
    }

    /**
     * Lesen Teil 3 in the existing SITUATION_MATCHING model: each advertisement becomes a passage labelled
     * a..l (rendered to HTML), each situation a question whose correctAnswer is the matching passage's id or
     * "X". The structured advertisements and the situations' matching profiles are kept in
     * {@code metadata.teil3} so the admin preview and the JSON export can show the original structure.
     */
    private static ExamExercise toSituationEntity(ParsedExercise ex, ExamType examType, String schemaVersion,
                                                  String promptVersion, String hash, String userId) {
        ExamContentSpec spec = ex.spec();
        Map<String, String> passageIdByAd = new LinkedHashMap<>();
        List<ExamPassage> passages = new ArrayList<>();
        List<Map<String, Object>> storedAds = new ArrayList<>();
        for (ParsedExercise.Advertisement ad : ex.advertisements().stream()
                .sorted(java.util.Comparator.comparing(ParsedExercise.Advertisement::id)).toList()) {
            ExamPassage passage = new ExamPassage(null, ad.id(), AdvertisementRenderer.toHtml(ad.content()), null, null, null).ensureId();
            passageIdByAd.put(ad.id(), passage.getId());
            passages.add(passage);
            Map<String, Object> stored = new LinkedHashMap<>();
            stored.put("id", ad.id());
            if (ad.type() != null) stored.put("type", ad.type());
            if (ad.layout() != null) stored.put("layout", ad.layout());
            stored.put("content", ad.content());
            if (!ad.visual().isEmpty()) stored.put("visual", ad.visual());
            if (!ad.matchingProfile().isEmpty()) stored.put("matchingProfile", ad.matchingProfile());
            storedAds.add(stored);
        }

        List<ExamQuestion> questions = new ArrayList<>();
        List<Map<String, Object>> storedSituations = new ArrayList<>();
        for (ParsedExercise.Situation s : ex.situations().stream()
                .sorted(java.util.Comparator.comparing(ParsedExercise.Situation::number)).toList()) {
            String correct = ExamContentValidator.NO_ADVERTISEMENT.equals(s.correctAdvertisementId())
                    ? "X" : passageIdByAd.get(s.correctAdvertisementId());
            questions.add(new ExamQuestion(null, ExamTaskType.SITUATION_MATCHING, s.text(), null, null, correct, null,
                    s.number(), null, null).ensureId());
            if (!s.matchingProfile().isEmpty()) {
                Map<String, Object> profile = new LinkedHashMap<>();
                profile.put("number", s.number());
                profile.put("matchingProfile", s.matchingProfile());
                storedSituations.add(profile);
            }
        }

        Map<String, Object> metadata = new LinkedHashMap<>(ex.metadata());
        Map<String, Object> teil3 = new LinkedHashMap<>();
        teil3.put("advertisements", storedAds);
        if (!storedSituations.isEmpty()) teil3.put("situations", storedSituations);
        metadata.put("teil3", teil3);

        ExamExercise exercise = new ExamExercise();
        exercise.setTitle(ex.title());
        exercise.setExamType(examType);
        exercise.setSection(spec.section());
        exercise.setTaskType(spec.taskType());
        exercise.setLevel(spec.level());
        exercise.setPartNumber(spec.part());
        exercise.setPassages(passages);
        exercise.setQuestions(questions);
        exercise.setTeilDescription(ex.instructions());
        exercise.setExternalId(ex.externalId());
        exercise.setSchemaVersion(schemaVersion);
        exercise.setPromptVersion(promptVersion);
        exercise.setMetadata(metadata);
        exercise.setContentHash(hash);
        exercise.setCreatedBy(userId);
        exercise.setUpdatedBy(userId);
        exercise.applyStatus(ExamContentStatus.DRAFT);
        return exercise;
    }

    /**
     * Schriftlicher Ausdruck in the existing WRITING_TASK model: the task (situation, email, instruction, points, guidance) is
     * one passage, exactly like the hand-authored task, and the four points are the Leitpunkte the planner uses. The structured
     * fields stay in the metadata so the task can be previewed and exported again.
     */
    private static ExamExercise toWritingEntity(ParsedExercise ex, ExamType examType, String schemaVersion,
                                                String promptVersion, String hash, String userId) {
        ExamContentSpec spec = ex.spec();
        ParsedExercise.Writing w = ex.writing();

        Map<String, Object> metadata = new LinkedHashMap<>(ex.metadata());
        metadata.putIfAbsent("source", "AI_IMPORTED");
        metadata.put("taskType", w.taskType());
        metadata.put("scenarioType", w.scenarioType());
        metadata.put("communicationType", w.communicationType());
        metadata.put("relationship", w.relationship());
        metadata.put("topic", w.topic());
        Map<String, Object> message = new LinkedHashMap<>();
        message.put("greeting", w.greeting());
        message.put("body", w.body());
        message.put("closing", w.closing());
        message.put("sender", w.sender());
        Map<String, Object> writing = new LinkedHashMap<>();
        writing.put("situation", w.situation());
        writing.put("incomingMessage", message);
        writing.put("writingGuidance", w.writingGuidance());
        metadata.put("writing", writing);

        ExamExercise exercise = new ExamExercise();
        exercise.setTitle(ex.title());
        exercise.setExamType(examType);
        exercise.setSection(spec.section());
        exercise.setTaskType(spec.taskType());
        exercise.setLevel(spec.level());
        exercise.setPartNumber(spec.part());
        exercise.setPassages(List.of(new ExamPassage(null, "Aufgabe", toWritingHtml(w, ex.instructions()), null, null, null).ensureId()));
        exercise.setQuestions(List.of());
        exercise.setLeitpunkte(w.points());
        exercise.setRequiresPlanning(true);
        if (w.modelBody() != null) exercise.setModelSolution(toModelAnswerHtml(w.modelSubject(), w.modelBody()));
        exercise.setTeilDescription(ex.instructions());
        exercise.setExternalId(ex.externalId());
        exercise.setSchemaVersion(schemaVersion);
        exercise.setPromptVersion(promptVersion);
        exercise.setMetadata(metadata);
        exercise.setContentHash(hash);
        exercise.setCreatedBy(userId);
        exercise.setUpdatedBy(userId);
        exercise.applyStatus(ExamContentStatus.DRAFT);
        return exercise;
    }

    /**
     * Mündlicher Ausdruck in the existing exercise model: one passage holds a readable summary of the task (for the admin list,
     * duplicate detection and as a fallback view), the structured, German-only learner content lives in {@code metadata.speaking}
     * and is what the learner screens render and what export writes back. There is nothing to grade, so there are no questions.
     */
    private static ExamExercise toSpeakingEntity(ParsedExercise ex, ExamType examType, String schemaVersion,
                                                 String promptVersion, String hash, String userId) {
        ExamContentSpec spec = ex.spec();
        ParsedExercise.Speaking s = ex.speaking();

        Map<String, Object> speaking = new LinkedHashMap<>();
        speaking.put("taskType", s.taskType());
        speaking.putAll(s.data());
        Map<String, Object> metadata = new LinkedHashMap<>(ex.metadata());
        metadata.putIfAbsent("source", "AI_IMPORTED");
        metadata.put("taskType", s.taskType());
        metadata.put("topic", s.topic());
        metadata.put("speaking", speaking);

        ExamExercise exercise = new ExamExercise();
        exercise.setTitle(ex.title());
        exercise.setExamType(examType);
        exercise.setSection(spec.section());
        exercise.setTaskType(spec.taskType());
        exercise.setLevel(spec.level());
        exercise.setPartNumber(spec.part());
        exercise.setPassages(List.of(new ExamPassage(null, "Aufgabe", toSpeakingHtml(s, ex.instructions()), null, null, null).ensureId()));
        exercise.setQuestions(List.of());
        exercise.setTeilDescription(ex.instructions());
        exercise.setExternalId(ex.externalId());
        exercise.setSchemaVersion(schemaVersion);
        exercise.setPromptVersion(promptVersion);
        exercise.setMetadata(metadata);
        exercise.setContentHash(hash);
        exercise.setCreatedBy(userId);
        exercise.setUpdatedBy(userId);
        exercise.applyStatus(ExamContentStatus.DRAFT);
        return exercise;
    }

    /** A readable, escaped HTML summary of a speaking task: what the learner is asked to talk about. */
    @SuppressWarnings("unchecked")
    static String toSpeakingHtml(ParsedExercise.Speaking s, String instructions) {
        StringBuilder html = new StringBuilder();
        if (s.topic() != null) html.append("<p><strong>").append(HtmlUtils.htmlEscape(s.topic())).append("</strong></p>");
        if (instructions != null) html.append("<p><em>").append(HtmlUtils.htmlEscape(instructions)).append("</em></p>");
        Map<String, Object> d = s.data();
        if (d.get("topics") instanceof List<?> topics) {
            html.append("<ul>");
            for (Object t : topics) {
                if (!(t instanceof Map<?, ?> topic)) continue;
                html.append("<li>").append(HtmlUtils.htmlEscape(String.valueOf(topic.get("title"))));
                if (topic.get("questions") instanceof List<?> questions) {
                    questions.forEach(q -> html.append("<br>").append(HtmlUtils.htmlEscape(String.valueOf(q))));
                }
                html.append("</li>");
            }
            html.append("</ul>");
        }
        if (d.get("person") instanceof Map<?, ?> person) {
            html.append("<p>").append(HtmlUtils.htmlEscape(person.get("name") + ", " + person.get("age") + " Jahre, " + person.get("occupation"))).append("</p>");
        }
        if (d.get("opinionText") instanceof String opinion) html.append(toHtml(opinion));
        if (d.get("scenario") instanceof String scenario) html.append(toHtml(scenario));
        if (d.get("planningPoints") instanceof List<?> points) {
            html.append("<ul>");
            points.forEach(pt -> {
                if (pt instanceof Map<?, ?> point) html.append("<li>").append(HtmlUtils.htmlEscape(String.valueOf(point.get("title")))).append("</li>");
            });
            html.append("</ul>");
        }
        return html.toString();
    }

    /** The learner-facing task text, in the same HTML shape as the hand-authored task (plain text is escaped). */
    static String toWritingHtml(ParsedExercise.Writing w, String instructions) {
        StringBuilder html = new StringBuilder();
        if (w.situation() != null) html.append("<p><em>").append(HtmlUtils.htmlEscape(w.situation())).append("</em></p>");
        html.append("<blockquote>");
        if (w.greeting() != null) html.append("<p>").append(HtmlUtils.htmlEscape(w.greeting())).append("</p>");
        html.append(toHtml(w.body()));
        String sign = (w.closing() == null ? "" : HtmlUtils.htmlEscape(w.closing())) + (w.sender() == null ? "" : "<br>" + HtmlUtils.htmlEscape(w.sender()));
        if (!sign.isEmpty()) html.append("<p>").append(sign).append("</p>");
        html.append("</blockquote>");
        if (instructions != null) html.append("<p><em>").append(HtmlUtils.htmlEscape(instructions)).append("</em></p>");
        if (!w.points().isEmpty()) {
            html.append("<ul>");
            w.points().forEach(point -> html.append("<li>").append(HtmlUtils.htmlEscape(point)).append("</li>"));
            html.append("</ul>");
        }
        if (w.writingGuidance() != null) html.append("<p><em>").append(HtmlUtils.htmlEscape(w.writingGuidance())).append("</em></p>");
        return html.toString();
    }

    private static String toModelAnswerHtml(String subject, String body) {
        return (subject == null ? "" : "<p><strong>Betreff: " + HtmlUtils.htmlEscape(subject) + "</strong></p>") + toHtml(body);
    }

    /**
     * Sprachbausteine Teil 2 in the existing WORD_BANK_CLOZE model: the (optional) context becomes a first passage, the
     * text a passage with gap badges, the shared words the exercise's answer options (labelled a..o) and each gap a
     * question whose correctAnswer is the word. Categories, focus, translations and the context's structure live in metadata.
     */
    private static ExamExercise toWordBankEntity(ParsedExercise ex, ExamType examType, String schemaVersion,
                                                 String promptVersion, String hash, String userId) {
        ExamContentSpec spec = ex.spec();
        Map<String, String> wordByKey = new LinkedHashMap<>();
        ex.wordBank().forEach(w -> wordByKey.put(w.id(), w.text()));

        List<ExamPassage> passages = new ArrayList<>();
        Map<String, Object> metadata = new LinkedHashMap<>(ex.metadata());
        if (ex.context() != null) {
            String title = ex.context().title();
            String html = (title.isBlank() ? "" : "<p><strong>" + HtmlUtils.htmlEscape(title) + "</strong></p>") + toHtml(ex.context().text());
            passages.add(new ExamPassage(null, "Kontext", html, null, null, null).ensureId());
            Map<String, Object> context = new LinkedHashMap<>();
            context.put("type", ex.context().type());
            context.put("title", title);
            context.put("text", ex.context().text());
            metadata.put("context", context);
        }
        passages.add(new ExamPassage(null, "Text", toGapHtml(ex.readingText()), null, null, null).ensureId());

        List<ExamQuestion> questions = new ArrayList<>();
        List<Map<String, Object>> gapInfo = new ArrayList<>();
        for (ParsedExercise.Question q : ex.questions().stream().sorted(java.util.Comparator.comparing(ParsedExercise.Question::number)).toList()) {
            questions.add(new ExamQuestion(null, ExamTaskType.WORD_BANK_CLOZE, "Lücke " + q.number(), null, null,
                    wordByKey.get(q.correctOptionId()), q.number(), q.number(), q.explanations().get("de"), null).ensureId());
            Map<String, Object> info = new LinkedHashMap<>();
            info.put("number", q.number());
            if (q.type() != null) info.put("category", q.type());
            if (q.grammarFocus() != null) info.put("grammarFocus", q.grammarFocus());
            Map<String, String> other = new LinkedHashMap<>(q.explanations());
            other.remove("de");
            if (!other.isEmpty()) info.put("explanation", other);
            gapInfo.add(info);
        }
        metadata.put("gapQuestions", gapInfo);

        ExamExercise exercise = new ExamExercise();
        exercise.setTitle(ex.title());
        exercise.setExamType(examType);
        exercise.setSection(spec.section());
        exercise.setTaskType(spec.taskType());
        exercise.setLevel(spec.level());
        exercise.setPartNumber(spec.part());
        exercise.setPassages(passages);
        exercise.setQuestions(questions);
        exercise.setAnswerOptions(ex.wordBank().stream().map(ParsedExercise.Option::text).toList());
        exercise.setAnswerOptionLabels(ex.wordBank().stream().map(ParsedExercise.Option::id).toList());
        exercise.setTeilDescription(ex.instructions());
        exercise.setExternalId(ex.externalId());
        exercise.setSchemaVersion(schemaVersion);
        exercise.setPromptVersion(promptVersion);
        exercise.setMetadata(metadata);
        exercise.setContentHash(hash);
        exercise.setCreatedBy(userId);
        exercise.setUpdatedBy(userId);
        exercise.applyStatus(ExamContentStatus.DRAFT);
        return exercise;
    }

    public static ExercisePreview toPreview(ParsedExercise ex) {
        if (ex.speaking() != null) {
            ParsedExercise.Speaking s = ex.speaking();
            return new ExercisePreview(ex.title(), ex.instructions(), List.of(), List.of(), null, List.of(), List.of(), List.of(), null, null,
                    new SpeakingView(s.taskType(), s.topic(), s.data()));
        }
        if (ex.writing() != null) {
            ParsedExercise.Writing w = ex.writing();
            return new ExercisePreview(ex.title(), ex.instructions(), List.of(), List.of(), null, List.of(), List.of(), List.of(), null,
                    new WritingView(w.taskType(), w.scenarioType(), w.topic(), w.communicationType(), w.relationship(), w.situation(),
                            w.greeting(), w.body(), w.closing(), w.sender(), w.points(), w.writingGuidance(), w.modelSubject(), w.modelBody()));
        }
        if (ex.spec() != null && ex.spec().isWordBank()) {
            return new ExercisePreview(ex.title(), ex.instructions(),
                    ex.wordBank().stream().map(w -> new HeadingView(w.id(), w.text())).toList(), List.of(), ex.readingText(),
                    ex.questions().stream().map(q -> new QuestionView(q.id(), q.number(), q.number() != null ? "Lücke " + q.number() : null,
                            List.of(), q.correctOptionId(), q.type())).toList(),
                    List.of(), List.of(),
                    ex.context() == null ? null : new ContextView(ex.context().type(), ex.context().title(), ex.context().text()));
        }
        if (ex.spec() != null && ex.spec().isSituationMatching()) {
            return new ExercisePreview(ex.title(), ex.instructions(), List.of(), List.of(), null, List.of(),
                    ex.situations().stream().map(s -> new SituationView(s.id(), s.number(), s.text(), s.correctAdvertisementId(), s.matchingProfile())).toList(),
                    ex.advertisements().stream().map(a -> new AdvertisementView(a.id(), a.type(), a.layout(), a.content(), a.visual(), a.matchingProfile())).toList());
        }
        if (ex.readingText() != null || (ex.spec() != null && ex.spec().isMultipleChoice())) {
            return new ExercisePreview(ex.title(), ex.instructions(), List.of(), List.of(), ex.readingText(),
                    ex.questions().stream().map(q -> new QuestionView(q.id(), q.number(),
                            q.question() != null ? q.question() : q.number() != null ? "Lücke " + q.number() : null,
                            q.options().stream().map(o -> new HeadingView(o.id(), o.text())).toList(),
                            q.correctOptionId(), q.type())).toList());
        }
        return new ExercisePreview(
                ex.title(), ex.instructions(),
                ex.headings().stream().map(h -> new HeadingView(h.id(), h.text())).toList(),
                ex.texts().stream().map(t -> new TextView(t.id(), t.content(), t.correctHeadingId())).toList(),
                null, List.of());
    }

    /**
     * Back to the import-file shape. Returns null for exercises this format cannot represent (not a
     * labelled headings-matching exercise), so export never emits something re-import would reject.
     */
    public static ObjectNode toExportNode(ObjectMapper mapper, ExamExercise e) {
        if (e.getSection() == ExamSection.MUENDLICHER_AUSDRUCK) return toSpeakingExportNode(mapper, e);
        if (e.getTaskType() == ExamTaskType.WRITING_TASK) return toWritingExportNode(mapper, e);
        if (e.getTaskType() == ExamTaskType.WORD_BANK_CLOZE) return toWordBankExportNode(mapper, e);
        if (e.getTaskType() == ExamTaskType.MULTIPLE_CHOICE) return toReadingExportNode(mapper, e);
        if (e.getTaskType() == ExamTaskType.SITUATION_MATCHING) return toSituationExportNode(mapper, e);
        if (e.getTaskType() != ExamTaskType.MATCHING || e.getAnswerOptions() == null || e.getPassages() == null
                || e.getQuestions() == null || e.getSection() == null || e.getLevel() == null || e.getPartNumber() == null) {
            return null;
        }
        List<String> labels = new ArrayList<>();
        for (int i = 0; i < e.getAnswerOptions().size(); i++) {
            String label = e.getAnswerOptionLabels() != null && i < e.getAnswerOptionLabels().size()
                    && e.getAnswerOptionLabels().get(i) != null && !e.getAnswerOptionLabels().get(i).isBlank()
                    ? e.getAnswerOptionLabels().get(i) : String.valueOf((char) ('a' + i));
            labels.add(label);
        }

        ObjectNode node = mapper.createObjectNode();
        if (e.getExternalId() != null) node.put("externalId", e.getExternalId());
        node.put("title", e.getTitle());
        node.put("instructions", e.getTeilDescription() == null ? "" : e.getTeilDescription());
        ArrayNode headings = node.putArray("headings");
        for (int i = 0; i < e.getAnswerOptions().size(); i++) {
            headings.addObject().put("id", labels.get(i)).put("text", e.getAnswerOptions().get(i));
        }
        ArrayNode texts = node.putArray("texts");
        for (int i = 0; i < e.getPassages().size(); i++) {
            final int passageIndex = i;
            String correct = e.getQuestions().stream()
                    .filter(q -> q.getSectionIndex() != null && q.getSectionIndex() == passageIndex)
                    .map(ExamQuestion::getCorrectAnswer)
                    .findFirst().orElse(null);
            int headingIndex = correct == null ? -1 : e.getAnswerOptions().indexOf(correct);
            ObjectNode t = texts.addObject();
            t.put("id", "text_" + (i + 1));
            t.put("content", toPlainText(e.getPassages().get(i).getContent()));
            t.put("correctHeadingId", headingIndex >= 0 ? labels.get(headingIndex) : "");
        }
        if (e.getMetadata() != null) node.set("metadata", mapper.valueToTree(e.getMetadata()));
        return node;
    }

    /**
     * Speaking task in the import shape, read back from {@code metadata.speaking}. Hand-made exercises without that structure
     * cannot be exported. Null values are left out so the file passes the importer again unchanged.
     */
    private static ObjectNode toSpeakingExportNode(ObjectMapper mapper, ExamExercise e) {
        if (e.getLevel() == null || e.getPartNumber() == null || e.getMetadata() == null
                || !(e.getMetadata().get("speaking") instanceof Map<?, ?> speaking)) {
            return null;
        }
        ObjectNode node = mapper.createObjectNode();
        if (e.getExternalId() != null) node.put("externalId", e.getExternalId());
        node.put("title", e.getTitle());
        node.put("instructions", e.getTeilDescription() == null ? "" : e.getTeilDescription());
        ObjectNode content = (ObjectNode) stripNulls(mapper.valueToTree(speaking));
        // planning points are stored with a generated id that the importer derives again
        if (content.get("planningPoints") instanceof ArrayNode points) {
            points.forEach(pt -> {
                if (pt instanceof ObjectNode o) o.remove("id");
            });
        }
        node.setAll(content);
        Map<String, Object> rest = new LinkedHashMap<>(e.getMetadata());
        for (String key : List.of("speaking", "taskType", "topic")) rest.remove(key);
        if (!rest.isEmpty()) node.set("metadata", mapper.valueToTree(rest));
        return node;
    }

    private static com.fasterxml.jackson.databind.JsonNode stripNulls(com.fasterxml.jackson.databind.JsonNode node) {
        if (node instanceof ObjectNode object) {
            List<String> remove = new ArrayList<>();
            object.fields().forEachRemaining(f -> {
                if (f.getValue().isNull()) remove.add(f.getKey());
                else stripNulls(f.getValue());
            });
            remove.forEach(object::remove);
        } else if (node instanceof ArrayNode array) {
            array.forEach(ExamContentMapper::stripNulls);
        }
        return node;
    }

    /**
     * Email-response task in the import shape. Only tasks that were imported (they carry the structured fields in their metadata)
     * can be exported; the points are read from the current Leitpunkte so an edit of the points is not lost.
     */
    @SuppressWarnings("unchecked")
    private static ObjectNode toWritingExportNode(ObjectMapper mapper, ExamExercise e) {
        if (e.getSection() != ExamSection.SCHRIFTLICHER_AUSDRUCK || e.getLevel() == null || e.getPartNumber() == null
                || e.getLeitpunkte() == null || e.getLeitpunkte().isEmpty() || e.getMetadata() == null
                || !(e.getMetadata().get("writing") instanceof Map<?, ?> writing)
                || !(writing.get("incomingMessage") instanceof Map<?, ?> message)) {
            return null;
        }
        Map<String, Object> metadata = e.getMetadata();
        ObjectNode node = mapper.createObjectNode();
        if (e.getExternalId() != null) node.put("externalId", e.getExternalId());
        node.put("title", e.getTitle());
        node.put("instructions", e.getTeilDescription() == null ? "" : e.getTeilDescription());
        node.put("taskType", String.valueOf(metadata.getOrDefault("taskType", "EMAIL_RESPONSE")));
        for (String key : List.of("scenarioType", "topic", "communicationType", "relationship")) {
            if (metadata.get(key) != null) node.put(key, metadata.get(key).toString());
        }
        ObjectNode task = node.putObject("task");
        task.put("situation", String.valueOf(writing.get("situation")));
        ObjectNode incoming = task.putObject("incomingMessage");
        for (String key : List.of("greeting", "body", "closing", "sender")) incoming.put(key, String.valueOf(message.get(key)));
        ArrayNode points = node.putArray("points");
        for (int i = 0; i < e.getLeitpunkte().size(); i++) points.addObject().put("number", i + 1).put("text", e.getLeitpunkte().get(i));
        if (writing.get("writingGuidance") != null) node.put("writingGuidance", writing.get("writingGuidance").toString());
        Map<String, Object> rest = new LinkedHashMap<>(metadata);
        for (String key : List.of("writing", "taskType", "scenarioType", "topic", "communicationType", "relationship")) rest.remove(key);
        if (!rest.isEmpty()) node.set("metadata", mapper.valueToTree(rest));
        return node;
    }

    /** Word bank + gaps in the import shape; null when the stored exercise is not a labelled Sprachbausteine Teil 2 exercise. */
    @SuppressWarnings("unchecked")
    private static ObjectNode toWordBankExportNode(ObjectMapper mapper, ExamExercise e) {
        if (e.getSection() != ExamSection.SPRACHBAUSTEINE || e.getPassages() == null || e.getPassages().isEmpty() || e.getPassages().size() > 2
                || e.getAnswerOptions() == null || e.getAnswerOptions().isEmpty() || e.getAnswerOptions().size() > 26
                || e.getQuestions() == null || e.getQuestions().isEmpty() || e.getLevel() == null || e.getPartNumber() == null) {
            return null;
        }
        for (ExamQuestion q : e.getQuestions()) {
            if (q.getGapNumber() == null || q.getCorrectAnswer() == null || !e.getAnswerOptions().contains(q.getCorrectAnswer())) return null;
        }
        Map<Integer, Map<String, Object>> gapInfo = new LinkedHashMap<>();
        if (e.getMetadata() != null && e.getMetadata().get("gapQuestions") instanceof List<?> list) {
            for (Object o : list) {
                if (o instanceof Map<?, ?> m && m.get("number") instanceof Number n) gapInfo.put(n.intValue(), (Map<String, Object>) m);
            }
        }
        List<String> keys = new ArrayList<>();
        for (int i = 0; i < e.getAnswerOptions().size(); i++) {
            String label = e.getAnswerOptionLabels() != null && i < e.getAnswerOptionLabels().size()
                    && e.getAnswerOptionLabels().get(i) != null && !e.getAnswerOptionLabels().get(i).isBlank()
                    ? e.getAnswerOptionLabels().get(i).trim().toLowerCase(java.util.Locale.ROOT) : String.valueOf((char) ('a' + i));
            keys.add(label);
        }

        ObjectNode node = mapper.createObjectNode();
        if (e.getExternalId() != null) node.put("externalId", e.getExternalId());
        node.put("title", e.getTitle());
        node.put("instructions", e.getTeilDescription() == null ? "" : e.getTeilDescription());
        if (e.getMetadata() != null) {
            if (e.getMetadata().get("contextType") != null) node.put("contextType", e.getMetadata().get("contextType").toString());
            if (e.getMetadata().get("topic") != null) node.put("topic", e.getMetadata().get("topic").toString());
        }
        if (e.getPassages().size() == 2) {
            ObjectNode context = node.putObject("context");
            Object stored = e.getMetadata() == null ? null : e.getMetadata().get("context");
            if (stored instanceof Map<?, ?> m) {
                context.put("type", String.valueOf(m.get("type")));
                context.put("title", m.get("title") == null ? "" : m.get("title").toString());
                context.put("text", String.valueOf(m.get("text")));
            } else {
                context.put("type", "ADVERTISEMENT").put("title", "").put("text", toPlainText(e.getPassages().get(0).getContent()));
            }
        }
        node.put("text", toPlainText(e.getPassages().get(e.getPassages().size() - 1).getContent()));
        ArrayNode bank = node.putArray("wordBank");
        for (int i = 0; i < keys.size(); i++) bank.addObject().put("key", keys.get(i)).put("word", e.getAnswerOptions().get(i));
        ArrayNode questions = node.putArray("questions");
        e.getQuestions().stream().sorted(java.util.Comparator.comparing(ExamQuestion::getGapNumber)).forEach(q -> {
            int at = e.getAnswerOptions().indexOf(q.getCorrectAnswer());
            ObjectNode qn = questions.addObject();
            qn.put("number", q.getGapNumber());
            qn.put("correctAnswer", keys.get(at));
            qn.put("correctWord", q.getCorrectAnswer());
            Map<String, Object> info = gapInfo.getOrDefault(q.getGapNumber(), Map.of());
            if (info.get("category") != null) qn.put("grammarCategory", info.get("category").toString());
            if (info.get("grammarFocus") != null) qn.put("grammarFocus", info.get("grammarFocus").toString());
            ObjectNode explanation = mapper.createObjectNode();
            if (q.getExplanation() != null && !q.getExplanation().isBlank()) explanation.put("de", q.getExplanation());
            if (info.get("explanation") instanceof Map<?, ?> other) other.forEach((k, v) -> explanation.put(k.toString(), String.valueOf(v)));
            if (!explanation.isEmpty()) qn.set("explanation", explanation);
        });
        if (e.getMetadata() != null) {
            Map<String, Object> metadata = new LinkedHashMap<>(e.getMetadata());
            for (String key : List.of("gapQuestions", "context", "contextType", "topic")) metadata.remove(key);
            if (!metadata.isEmpty()) node.set("metadata", mapper.valueToTree(metadata));
        }
        return node;
    }

    /** Situations + advertisements in the import shape; null when a stored answer cannot be mapped back to an ad letter. */
    @SuppressWarnings("unchecked")
    private static ObjectNode toSituationExportNode(ObjectMapper mapper, ExamExercise e) {
        if (e.getPassages() == null || e.getPassages().isEmpty() || e.getQuestions() == null || e.getQuestions().isEmpty()
                || e.getSection() == null || e.getLevel() == null || e.getPartNumber() == null) {
            return null;
        }
        Map<String, String> letterByPassageId = new LinkedHashMap<>();
        for (int i = 0; i < e.getPassages().size(); i++) {
            ExamPassage p = e.getPassages().get(i);
            String label = p.getLabel() != null && !p.getLabel().isBlank() ? p.getLabel().trim().toLowerCase(java.util.Locale.ROOT)
                    : String.valueOf((char) ('a' + i));
            letterByPassageId.put(p.getId(), label);
        }
        Map<String, Object> teil3 = e.getMetadata() != null && e.getMetadata().get("teil3") instanceof Map<?, ?> m
                ? (Map<String, Object>) m : Map.of();
        Map<String, Map<String, Object>> storedAds = new LinkedHashMap<>();
        if (teil3.get("advertisements") instanceof List<?> list) {
            for (Object o : list) {
                if (o instanceof Map<?, ?> m && m.get("id") != null) storedAds.put(m.get("id").toString(), (Map<String, Object>) m);
            }
        }
        Map<Integer, Object> storedProfiles = new LinkedHashMap<>();
        if (teil3.get("situations") instanceof List<?> list) {
            for (Object o : list) {
                if (o instanceof Map<?, ?> m && m.get("number") instanceof Number n) storedProfiles.put(n.intValue(), m.get("matchingProfile"));
            }
        }

        ObjectNode node = mapper.createObjectNode();
        if (e.getExternalId() != null) node.put("externalId", e.getExternalId());
        node.put("title", e.getTitle());
        node.put("instructions", e.getTeilDescription() == null ? "" : e.getTeilDescription());

        ArrayNode situations = node.putArray("situations");
        List<ExamQuestion> ordered = e.getQuestions().stream()
                .sorted(java.util.Comparator.comparing(q -> q.getQuestionNumber() == null ? Integer.MAX_VALUE : q.getQuestionNumber())).toList();
        for (int i = 0; i < ordered.size(); i++) {
            ExamQuestion q = ordered.get(i);
            String answer = "X".equalsIgnoreCase(q.getCorrectAnswer()) ? "x" : letterByPassageId.get(q.getCorrectAnswer());
            if (answer == null) return null;
            int number = q.getQuestionNumber() != null ? q.getQuestionNumber() : i + 1;
            ObjectNode sn = situations.addObject();
            sn.put("id", "situation_" + number);
            sn.put("number", number);
            sn.put("text", q.getPrompt());
            sn.put("correctAdvertisementId", answer);
            if (storedProfiles.get(number) != null) sn.set("matchingProfile", mapper.valueToTree(storedProfiles.get(number)));
        }

        ArrayNode ads = node.putArray("advertisements");
        for (ExamPassage p : e.getPassages()) {
            String letter = letterByPassageId.get(p.getId());
            Map<String, Object> stored = storedAds.get(letter);
            ObjectNode an = ads.addObject();
            an.put("id", letter);
            // Use the structured ad only while the passage still matches it; after a hand edit fall back to the edited text.
            boolean intact = stored != null && stored.get("content") instanceof Map<?, ?> c
                    && AdvertisementRenderer.toHtml((Map<String, Object>) c).equals(p.getContent());
            if (intact) {
                if (stored.get("type") != null) an.put("type", stored.get("type").toString());
                if (stored.get("layout") != null) an.put("layout", stored.get("layout").toString());
                an.set("content", mapper.valueToTree(stored.get("content")));
                if (stored.get("visual") != null) an.set("visual", mapper.valueToTree(stored.get("visual")));
                if (stored.get("matchingProfile") != null) an.set("matchingProfile", mapper.valueToTree(stored.get("matchingProfile")));
            } else {
                an.putObject("content").put("description", toPlainText(p.getContent()));
            }
        }
        if (e.getMetadata() != null) {
            Map<String, Object> metadata = new LinkedHashMap<>(e.getMetadata());
            metadata.remove("teil3");
            if (!metadata.isEmpty()) node.set("metadata", mapper.valueToTree(metadata));
        }
        return node;
    }

    /** Reading text + multiple-choice questions in the import shape; null when the stored exercise does not fit it. */
    @SuppressWarnings("unchecked")
    private static ObjectNode toReadingExportNode(ObjectMapper mapper, ExamExercise e) {
        if (e.getPassages() == null || e.getPassages().size() != 1 || e.getQuestions() == null || e.getQuestions().isEmpty()
                || e.getSection() == null || e.getLevel() == null || e.getPartNumber() == null) {
            return null;
        }
        for (ExamQuestion q : e.getQuestions()) {
            if (q.getOptions() == null || q.getOptions().isEmpty() || q.getOptions().size() > 26
                    || q.getCorrectAnswer() == null || !q.getOptions().contains(q.getCorrectAnswer())) {
                return null;
            }
        }
        boolean gaps = e.getSection() == ExamSection.SPRACHBAUSTEINE;
        List<ExamQuestion> ordered = e.getQuestions().stream()
                .sorted(java.util.Comparator.comparing(q -> q.getQuestionNumber() == null ? Integer.MAX_VALUE : q.getQuestionNumber()))
                .toList();
        Object storedTypes = e.getMetadata() == null ? null : e.getMetadata().get("questionTypes");
        Map<Integer, Map<String, Object>> gapInfo = new LinkedHashMap<>();
        if (gaps && e.getMetadata() != null && e.getMetadata().get("gapQuestions") instanceof List<?> list) {
            for (Object o : list) {
                if (o instanceof Map<?, ?> m && m.get("number") instanceof Number n) gapInfo.put(n.intValue(), (Map<String, Object>) m);
            }
        }

        ObjectNode node = mapper.createObjectNode();
        if (e.getExternalId() != null) node.put("externalId", e.getExternalId());
        node.put("title", e.getTitle());
        node.put("instructions", e.getTeilDescription() == null ? "" : e.getTeilDescription());
        if (gaps && e.getMetadata() != null) {
            if (e.getMetadata().get("textType") != null) node.put("textType", e.getMetadata().get("textType").toString());
            if (e.getMetadata().get("topic") != null) node.put("topic", e.getMetadata().get("topic").toString());
        }
        String text = toPlainText(e.getPassages().get(0).getContent());
        if (gaps) node.put("text", text);
        else node.putObject("text").put("content", text);
        ArrayNode questions = node.putArray("questions");
        for (int i = 0; i < ordered.size(); i++) {
            ExamQuestion q = ordered.get(i);
            int number = q.getQuestionNumber() != null ? q.getQuestionNumber() : i + 1;
            ObjectNode qn = questions.addObject();
            qn.put("id", "question_" + (i + 1));
            qn.put("number", number);
            if (!(gaps && ("Lücke " + number).equals(q.getPrompt()))) qn.put("question", q.getPrompt());
            ArrayNode options = qn.putArray("options");
            for (int j = 0; j < q.getOptions().size(); j++) {
                options.addObject().put("id", String.valueOf((char) ('a' + j))).put("text", q.getOptions().get(j));
            }
            qn.put("correctOptionId", String.valueOf((char) ('a' + q.getOptions().indexOf(q.getCorrectAnswer()))));
            if (gaps) {
                Map<String, Object> info = gapInfo.getOrDefault(number, Map.of());
                if (info.get("category") != null) qn.put("category", info.get("category").toString());
                if (info.get("grammarFocus") != null) qn.put("grammarFocus", info.get("grammarFocus").toString());
                ObjectNode explanation = mapper.createObjectNode();
                if (q.getExplanation() != null && !q.getExplanation().isBlank()) explanation.put("de", q.getExplanation());
                if (info.get("explanation") instanceof Map<?, ?> other) other.forEach((k, v) -> explanation.put(k.toString(), String.valueOf(v)));
                if (!explanation.isEmpty()) qn.set("explanation", explanation);
            } else if (storedTypes instanceof List<?> list && list.size() == ordered.size() && list.get(i) instanceof String type && !type.isBlank()) {
                qn.put("questionType", type);
            }
        }
        if (e.getMetadata() != null) {
            Map<String, Object> metadata = new LinkedHashMap<>(e.getMetadata());
            metadata.remove("questionTypes");
            metadata.remove("gapQuestions");
            metadata.remove("textType");
            metadata.remove("topic");
            if (!metadata.isEmpty()) node.set("metadata", mapper.valueToTree(metadata));
        }
        return node;
    }

    /** Escapes the plain text and turns blank-line-separated paragraphs into {@code <p>} elements. */
    static String toHtml(String content) {
        if (content == null) return "";
        StringBuilder html = new StringBuilder();
        for (String paragraph : content.strip().split("\\R{2,}")) {
            if (paragraph.isBlank()) continue;
            html.append("<p>").append(HtmlUtils.htmlEscape(paragraph.strip()).replaceAll("\\R", "<br>")).append("</p>");
        }
        return html.toString();
    }

    /** Like {@link #toHtml}, with every {@code [21]} marker turned into the editor's gap badge (the contract in examGap.ts). */
    static String toGapHtml(String content) {
        return toHtml(content).replaceAll("\\[(\\d{1,3})]", "<span data-exam-gap=\"$1\" class=\"exam-gap-marker\">$1</span>");
    }

    static String toPlainText(String html) {
        if (html == null) return "";
        html = html.replaceAll("<span[^>]*data-exam-gap=\"(\\d+)\"[^>]*>\\d+</span>", "[$1]");
        String text = html.replaceAll("(?i)<br\\s*/?>", "\n").replaceAll("(?i)</p>\\s*<p>", "\n\n").replaceAll("<[^>]*>", "");
        return HtmlUtils.htmlUnescape(text).strip();
    }
}
