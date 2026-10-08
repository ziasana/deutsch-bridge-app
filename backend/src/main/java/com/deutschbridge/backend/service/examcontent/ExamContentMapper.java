package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.model.dto.ExamContentDtos.ExercisePreview;
import com.deutschbridge.backend.model.dto.ExamContentDtos.HeadingView;
import com.deutschbridge.backend.model.dto.ExamContentDtos.QuestionView;
import com.deutschbridge.backend.model.dto.ExamContentDtos.TextView;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.ExamPassage;
import com.deutschbridge.backend.model.entity.ExamQuestion;
import com.deutschbridge.backend.model.enums.ExamContentStatus;
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
        List<ExamQuestion> questions = new ArrayList<>();
        List<String> types = new ArrayList<>();
        for (int i = 0; i < ex.questions().size(); i++) {
            ParsedExercise.Question q = ex.questions().get(i);
            String correct = q.options().stream().filter(o -> o.id().equals(q.correctOptionId()))
                    .map(ParsedExercise.Option::text).findFirst().orElse(null);
            int number = q.number() != null ? q.number() : spec.firstQuestionNumber() + i;
            questions.add(new ExamQuestion(null, ExamTaskType.MULTIPLE_CHOICE, q.question(), 0,
                    q.options().stream().map(ParsedExercise.Option::text).toList(), correct, null, number, null, null).ensureId());
            types.add(q.type() == null ? "" : q.type());
        }
        // Questions are shown to learners sorted by number; keep the stored order consistent with that.
        questions.sort(java.util.Comparator.comparing(ExamQuestion::getQuestionNumber));

        Map<String, Object> metadata = new LinkedHashMap<>(ex.metadata());
        if (types.stream().anyMatch(t -> !t.isEmpty())) {
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
        exercise.setPassages(new ArrayList<>(List.of(new ExamPassage(null, "Text", toHtml(ex.readingText()), null, null, null).ensureId())));
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

    public static ExercisePreview toPreview(ParsedExercise ex) {
        if (ex.readingText() != null || (ex.spec() != null && ex.spec().isMultipleChoice())) {
            return new ExercisePreview(ex.title(), ex.instructions(), List.of(), List.of(), ex.readingText(),
                    ex.questions().stream().map(q -> new QuestionView(q.id(), q.number(), q.question(),
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
        if (e.getTaskType() == ExamTaskType.MULTIPLE_CHOICE) return toReadingExportNode(mapper, e);
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

    /** Reading text + multiple-choice questions in the import shape; null when the stored exercise does not fit it. */
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
        List<ExamQuestion> ordered = e.getQuestions().stream()
                .sorted(java.util.Comparator.comparing(q -> q.getQuestionNumber() == null ? Integer.MAX_VALUE : q.getQuestionNumber()))
                .toList();
        Object storedTypes = e.getMetadata() == null ? null : e.getMetadata().get("questionTypes");

        ObjectNode node = mapper.createObjectNode();
        if (e.getExternalId() != null) node.put("externalId", e.getExternalId());
        node.put("title", e.getTitle());
        node.put("instructions", e.getTeilDescription() == null ? "" : e.getTeilDescription());
        node.putObject("text").put("content", toPlainText(e.getPassages().get(0).getContent()));
        ArrayNode questions = node.putArray("questions");
        for (int i = 0; i < ordered.size(); i++) {
            ExamQuestion q = ordered.get(i);
            ObjectNode qn = questions.addObject();
            qn.put("id", "question_" + (i + 1));
            qn.put("number", q.getQuestionNumber() != null ? q.getQuestionNumber() : i + 1);
            qn.put("question", q.getPrompt());
            ArrayNode options = qn.putArray("options");
            for (int j = 0; j < q.getOptions().size(); j++) {
                options.addObject().put("id", String.valueOf((char) ('a' + j))).put("text", q.getOptions().get(j));
            }
            qn.put("correctOptionId", String.valueOf((char) ('a' + q.getOptions().indexOf(q.getCorrectAnswer()))));
            if (storedTypes instanceof List<?> list && list.size() == ordered.size() && list.get(i) instanceof String type && !type.isBlank()) {
                qn.put("questionType", type);
            }
        }
        if (e.getMetadata() != null) {
            Map<String, Object> metadata = new LinkedHashMap<>(e.getMetadata());
            metadata.remove("questionTypes");
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

    static String toPlainText(String html) {
        if (html == null) return "";
        String text = html.replaceAll("(?i)<br\\s*/?>", "\n").replaceAll("(?i)</p>\\s*<p>", "\n\n").replaceAll("<[^>]*>", "");
        return HtmlUtils.htmlUnescape(text).strip();
    }
}
