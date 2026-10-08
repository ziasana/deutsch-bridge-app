package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.model.dto.ExamContentDtos.ExercisePreview;
import com.deutschbridge.backend.model.dto.ExamContentDtos.HeadingView;
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

    public static ExercisePreview toPreview(ParsedExercise ex) {
        return new ExercisePreview(
                ex.title(), ex.instructions(),
                ex.headings().stream().map(h -> new HeadingView(h.id(), h.text())).toList(),
                ex.texts().stream().map(t -> new TextView(t.id(), t.content(), t.correctHeadingId())).toList());
    }

    /**
     * Back to the import-file shape. Returns null for exercises this format cannot represent (not a
     * labelled headings-matching exercise), so export never emits something re-import would reject.
     */
    public static ObjectNode toExportNode(ObjectMapper mapper, ExamExercise e) {
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
