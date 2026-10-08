package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExamContentDtos.*;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.enums.ExamContentStatus;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.ExamExerciseRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Admin content pipeline for exam exercises: prompt generation, strict validation with duplicate
 * detection, import as DRAFT, the review/publish status workflow, and JSON export. No AI is called
 * from the backend - content comes from any external AI as a JSON file / pasted text.
 */
@Service
public class ExamContentService {

    private static final Set<String> STRUCTURE_ERROR_CODES = Set.of(
            "HEADING_COUNT", "HEADING_IDS", "HEADING_ID_MISSING", "HEADING_ID_DUPLICATE", "HEADINGS_MISSING", "HEADING_TEXT_EMPTY");
    private static final Set<String> TEXT_ERROR_CODES = Set.of(
            "TEXT_COUNT", "TEXT_IDS", "TEXT_ID_MISSING", "TEXT_ID_DUPLICATE", "TEXTS_MISSING", "TEXT_EMPTY");
    private static final Set<String> ANSWER_ERROR_CODES = Set.of(
            "CORRECT_HEADING_MISSING", "CORRECT_HEADING_UNKNOWN", "CORRECT_HEADING_REUSED", "UNUSED_HEADINGS");

    private static final Set<String> READING_TEXT_ERROR_CODES = Set.of("READING_TEXT_MISSING", "READING_TEXT_TOO_LONG", "GAP_MARKER_MISSING", "GAP_MARKER_DUPLICATE", "GAP_MARKER_UNEXPECTED");
    private static final Set<String> QUESTION_ERROR_CODES = Set.of(
            "QUESTION_COUNT", "QUESTIONS_MISSING", "QUESTION_ID_MISSING", "QUESTION_ID_DUPLICATE", "QUESTION_NUMBER_DUPLICATE",
            "QUESTION_NUMBER_INVALID", "QUESTION_TEXT_EMPTY", "QUESTION_TEXT_TOO_LONG", "QUESTION_TEXT_DUPLICATE");
    private static final Set<String> SITUATION_ERROR_CODES = Set.of(
            "SITUATION_COUNT", "SITUATIONS_MISSING", "SITUATION_ID_MISSING", "SITUATION_ID_DUPLICATE", "SITUATION_NUMBER_INVALID",
            "SITUATION_NUMBER_DUPLICATE", "SITUATION_NUMBERS", "SITUATION_TEXT_EMPTY", "SITUATION_TEXT_TOO_LONG");
    private static final Set<String> AD_ERROR_CODES = Set.of(
            "AD_COUNT", "ADVERTISEMENTS_MISSING", "AD_ID_MISSING", "AD_ID_DUPLICATE", "AD_IDS", "AD_CONTENT_MISSING", "AD_CONTENT_EMPTY",
            "AD_DETAILS_INVALID", "AD_CONTACT_INVALID", "AD_CONTENT_TOO_LONG", "AD_VISUAL_INVALID", "AD_IMAGE_TYPE_INVALID", "AD_ALT_TEXT_MISSING");
    private static final Set<String> SITUATION_ANSWER_CODES = Set.of("SITUATION_ANSWER_MISSING", "SITUATION_ANSWER_INVALID", "AD_REUSED");
    private static final Set<String> OPTION_ERROR_CODES = Set.of(
            "OPTIONS_MISSING", "OPTION_COUNT", "OPTION_IDS", "OPTION_ID_MISSING", "OPTION_ID_DUPLICATE", "OPTION_TEXT_EMPTY",
            "OPTION_TEXT_TOO_LONG", "OPTION_TEXT_DUPLICATE", "CORRECT_OPTION_MISSING", "CORRECT_OPTION_UNKNOWN");

    private final ExamExerciseRepository repository;
    private final RequestContext requestContext;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ExamContentValidator validator = new ExamContentValidator();
    private final ExamDuplicateDetector detector = new ExamDuplicateDetector();
    private final ExamContentPromptBuilder promptBuilder = new ExamContentPromptBuilder();

    public ExamContentService(ExamExerciseRepository repository, RequestContext requestContext) {
        this.repository = repository;
        this.requestContext = requestContext;
    }

    // ------------------------------------------------------------------ options + prompt

    public OptionsResponse options() {
        List<SpecInfo> specs = ExamContentSpecs.all().stream()
                .map(s -> new SpecInfo(s.examType().name(), s.level().getValue(), ExamContentTokens.sectionToken(s.section()),
                        ExamContentTokens.sectionLabel(s.section()), ExamContentTokens.partToken(s.part()),
                        s.headingCount(), s.textCount(), s.label(), s.taskType().name(), s.questionCount(), s.optionCount()))
                .toList();
        return new OptionsResponse(
                specs,
                Arrays.stream(ExamType.values()).map(Enum::name).toList(),
                ExamContentPromptBuilder.TOPICS,
                ExamContentPromptBuilder.DIFFICULTIES,
                Arrays.stream(ExamContentStatus.values()).map(Enum::name).toList(),
                ExamContentSpecs.SCHEMA_VERSION,
                ExamContentPromptBuilder.TEXT_TYPES,
                ExamContentPromptBuilder.GRAMMAR_CATEGORIES);
    }

    @Transactional(readOnly = true)
    public PromptResponse buildPrompt(PromptRequest request) {
        ExamContentSpec spec = resolveSpec(request);
        int existing = (int) repository.countByExamTypeAndSectionAndLevelAndPartNumber(
                spec.examType(), spec.section(), spec.level(), spec.part());
        int next = ExamContentPromptBuilder.nextNumber(spec.externalIdPrefix(),
                repository.findExternalIdsStartingWith(spec.externalIdPrefix()));
        return promptBuilder.build(spec, request, existing, next);
    }

    private ExamContentSpec resolveSpec(PromptRequest request) {
        ExamType exam = ExamContentTokens.parseExam(request.exam())
                .orElseThrow(() -> new IllegalArgumentException("Unknown exam: " + request.exam()));
        LearningLevel level = ExamContentTokens.parseLevel(request.level())
                .orElseThrow(() -> new IllegalArgumentException("Unknown level: " + request.level()));
        ExamSection section = ExamContentTokens.parseSection(request.section())
                .orElseThrow(() -> new IllegalArgumentException("Unknown section: " + request.section()));
        int part = ExamContentTokens.parsePart(request.part())
                .orElseThrow(() -> new IllegalArgumentException("Unknown part: " + request.part()));
        return ExamContentSpecs.find(exam, level, section, part)
                .orElseThrow(() -> new IllegalArgumentException("No content specification registered for "
                        + exam.getValue() + " " + level.getValue() + " " + ExamContentTokens.sectionLabel(section) + " Teil " + part));
    }

    // ------------------------------------------------------------------ validation

    private record Analysis(ValidationReport report, ExamContentValidator.FileResult file, Map<Integer, String> hashes) {
    }

    @Transactional(readOnly = true)
    public ValidationReport validate(String json) {
        return analyze(json).report();
    }

    private Analysis analyze(String json) {
        ExamImportParser.ParseResult parsed = ExamImportParser.parse(json);
        if (!parsed.ok()) {
            Issue issue = new Issue(ExamContentValidator.ERROR, "JSON_SYNTAX", "$", parsed.error());
            return new Analysis(new ValidationReport(false, false, null, null, null, null, null, null, 0, 0, 0, 0, 0, 0, 0,
                    List.of(new Check("JSON syntax", false)), List.of(issue), List.of()), null, Map.of());
        }

        ExamContentValidator.FileResult file = validator.validate(parsed.root());
        List<ParsedExercise> exercises = file.exercises();

        List<ExamDuplicateDetector.Candidate> candidates = new ArrayList<>();
        Set<String> loaded = new LinkedHashSet<>();
        Set<String> loadedKeys = new LinkedHashSet<>();
        for (ParsedExercise ex : exercises) {
            if (ex.spec() == null || !loadedKeys.add(ex.spec().section() + "/" + ex.spec().taskType())) continue;
            for (ExamExercise e : repository.findBySectionAndTaskType(ex.spec().section(), ex.spec().taskType())) {
                if (loaded.add(e.getId())) candidates.add(ExamDuplicateDetector.Candidate.of(e));
            }
        }

        List<ExerciseReport> reports = new ArrayList<>();
        Map<Integer, String> hashes = new LinkedHashMap<>();
        int importable = 0;
        int similar = 0;
        int duplicates = 0;
        for (ParsedExercise ex : exercises) {
            List<Issue> issues = new ArrayList<>(file.exerciseIssues().getOrDefault(ex.index(), List.of()));
            boolean valid = issues.stream().noneMatch(i -> ExamContentValidator.ERROR.equals(i.severity()));
            List<DuplicateMatch> matches = List.of();
            if (valid && ex.spec() != null) {
                String hash = ExamContentFingerprint.hashTexts(ex.textContents());
                hashes.put(ex.index(), hash);
                matches = detector.detect(ex, ex.spec().examType(), hash, candidates);
                candidates.add(ExamDuplicateDetector.Candidate.of(ex, ex.spec().examType(), hash));
            }
            String state = stateOf(valid, matches);
            boolean canImport = valid && (state.equals("OK") || state.equals("SIMILAR"));
            if (canImport) importable++;
            if (state.equals("SIMILAR")) similar++;
            if (state.equals("EXACT_DUPLICATE") || state.equals("EXTERNAL_ID_EXISTS")) duplicates++;
            if (state.equals("SIMILAR")) {
                issues.add(new Issue(ExamContentValidator.WARNING, "SIMILAR_CONTENT", "exercises[" + ex.index() + "]",
                        "Similar content already exists — review the comparison before importing."));
            }
            reports.add(new ExerciseReport(ex.index(), ex.externalId(), ex.title(), valid, state, canImport, issues, matches,
                    ExamContentMapper.toPreview(ex)));
        }

        return new Analysis(buildReport(file, reports, importable, similar, duplicates), file, hashes);
    }

    private static String stateOf(boolean valid, List<DuplicateMatch> matches) {
        if (!valid) return "INVALID";
        if (matches.stream().anyMatch(m -> m.kind().equals("EXTERNAL_ID"))) return "EXTERNAL_ID_EXISTS";
        if (matches.stream().anyMatch(m -> m.kind().endsWith("EXACT"))) return "EXACT_DUPLICATE";
        if (matches.stream().anyMatch(m -> m.kind().endsWith("SIMILAR"))) return "SIMILAR";
        return "OK";
    }

    private ValidationReport buildReport(ExamContentValidator.FileResult file, List<ExerciseReport> reports,
                                         int importable, int similar, int duplicates) {
        List<Issue> fileIssues = new ArrayList<>(file.fileIssues());
        boolean anyError = fileIssues.stream().anyMatch(i -> ExamContentValidator.ERROR.equals(i.severity()))
                || reports.stream().anyMatch(r -> !r.valid());
        int headings = file.exercises().stream().mapToInt(e -> e.headings().size()).sum();
        int texts = file.exercises().stream().mapToInt(e -> e.texts().size()).sum();
        int questions = file.exercises().stream().mapToInt(e -> e.questions().size() + e.situations().size()).sum();
        boolean reading = file.exercises().stream().anyMatch(e -> e.spec() != null && e.spec().isMultipleChoice());
        boolean situation = file.exercises().stream().anyMatch(e -> e.spec() != null && e.spec().isSituationMatching());
        boolean matching = file.exercises().stream().anyMatch(e -> e.spec() != null && !e.spec().isMultipleChoice() && !e.spec().isSituationMatching());
        int situations = file.exercises().stream().mapToInt(e -> e.situations().size()).sum();
        int advertisements = file.exercises().stream().mapToInt(e -> e.advertisements().size()).sum();

        List<Issue> all = new ArrayList<>(fileIssues);
        reports.forEach(r -> all.addAll(r.issues()));

        List<Check> checks = new ArrayList<>();
        checks.add(new Check("JSON syntax valid", true));
        checks.add(new Check("Schema version: " + orDash(file.schemaVersion()), noCode(all, "SCHEMA_VERSION_MISSING", "SCHEMA_VERSION_UNSUPPORTED")));
        checks.add(new Check("Content type: " + orDash(file.contentType()), noCode(all, "CONTENT_TYPE_INVALID", "EXERCISES_MISSING", "TOO_MANY_EXERCISES")));
        checks.add(new Check("Exam: " + orDash(file.exam()), noCode(all, "EXAM_INVALID")));
        checks.add(new Check("Level: " + orDash(file.level()), noCode(all, "LEVEL_INVALID")));
        checks.add(new Check("Section: " + orDash(file.section()), noCode(all, "SECTION_INVALID")));
        checks.add(new Check("Part: " + orDash(file.part()), noCode(all, "PART_INVALID", "SPEC_UNSUPPORTED")));
        checks.add(new Check("Exercises: " + reports.size(), !reports.isEmpty() && noCode(all, "EXERCISE_NOT_OBJECT", "EXTERNAL_ID_INVALID", "EXTERNAL_ID_DUPLICATE_IN_FILE")));
        if (matching || (!reading && !situation)) {
            checks.add(new Check("Headings: " + headings, !reports.isEmpty() && noCode(all, STRUCTURE_ERROR_CODES.toArray(String[]::new))));
            checks.add(new Check("Texts: " + texts, !reports.isEmpty() && noCode(all, TEXT_ERROR_CODES.toArray(String[]::new))));
            checks.add(new Check("Answer assignments valid", !reports.isEmpty() && noCode(all, ANSWER_ERROR_CODES.toArray(String[]::new))));
        }
        if (situation) {
            checks.add(new Check("Situations: " + situations, !reports.isEmpty() && noCode(all, SITUATION_ERROR_CODES.toArray(String[]::new))));
            checks.add(new Check("Advertisements: " + advertisements, !reports.isEmpty() && noCode(all, AD_ERROR_CODES.toArray(String[]::new))));
            checks.add(new Check("Matching valid (each advertisement used once)", !reports.isEmpty() && noCode(all, SITUATION_ANSWER_CODES.toArray(String[]::new))));
        }
        if (reading) {
            checks.add(new Check("Reading texts: " + file.exercises().stream().filter(e -> e.readingText() != null).count(),
                    !reports.isEmpty() && noCode(all, READING_TEXT_ERROR_CODES.toArray(String[]::new))));
            checks.add(new Check("Questions: " + questions, !reports.isEmpty() && noCode(all, QUESTION_ERROR_CODES.toArray(String[]::new))));
            checks.add(new Check("Options and correct answers valid", !reports.isEmpty() && noCode(all, OPTION_ERROR_CODES.toArray(String[]::new))));
        }

        return new ValidationReport(true, !anyError && !reports.isEmpty(), file.schemaVersion(), file.contentType(), file.exam(),
                file.level(), file.section(), file.part(), reports.size(), headings, texts, questions, importable, similar, duplicates,
                checks, fileIssues, reports);
    }

    private static boolean noCode(List<Issue> issues, String... codes) {
        Set<String> set = Set.of(codes);
        return issues.stream().noneMatch(i -> ExamContentValidator.ERROR.equals(i.severity()) && set.contains(i.code()));
    }

    private static String orDash(String s) {
        return s == null ? "—" : s;
    }

    // ------------------------------------------------------------------ import

    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = "examExercises", allEntries = true),
            @CacheEvict(cacheNames = "examAdminList", allEntries = true),
            @CacheEvict(cacheNames = "examLevelSummary", allEntries = true)
    })
    public ImportResult importContent(ImportRequest request) {
        Analysis analysis = analyze(request.json());
        if (analysis.file() == null || analysis.report().exercises().isEmpty()) {
            throw new IllegalArgumentException(analysis.report().issues().isEmpty()
                    ? "Nothing to import." : analysis.report().issues().get(0).message());
        }
        boolean fileLevelErrors = analysis.report().issues().stream().anyMatch(i -> ExamContentValidator.ERROR.equals(i.severity()));
        if (fileLevelErrors) {
            throw new IllegalArgumentException(analysis.report().issues().get(0).message());
        }

        Set<Integer> selected = request.selectedIndexes() == null ? null : new LinkedHashSet<>(request.selectedIndexes());
        String userId = requestContext.getUserId();
        List<ImportedExercise> imported = new ArrayList<>();
        List<SkippedExercise> skipped = new ArrayList<>();

        for (ExerciseReport report : analysis.report().exercises()) {
            ParsedExercise parsed = analysis.file().exercises().get(report.index());
            boolean wanted = selected == null ? "OK".equals(report.state()) : selected.contains(report.index());
            if (!wanted) {
                String reason = !report.importable() ? skipReason(report)
                        : selected == null && "SIMILAR".equals(report.state()) ? "Similar content exists — select it explicitly to import anyway."
                        : "Not selected.";
                skipped.add(new SkippedExercise(report.index(), report.externalId(), report.title(), reason));
                continue;
            }
            if (!report.importable()) {
                skipped.add(new SkippedExercise(report.index(), report.externalId(), report.title(), skipReason(report)));
                continue;
            }
            ExamExercise saved = repository.save(ExamContentMapper.toEntity(parsed, parsed.spec().examType(),
                    analysis.file().schemaVersion(), analysis.file().promptVersion(), analysis.hashes().get(report.index()), userId));
            imported.add(new ImportedExercise(report.index(), saved.getId(), saved.getExternalId(), saved.getTitle()));
        }
        return new ImportResult(imported, skipped);
    }

    private static String skipReason(ExerciseReport report) {
        return switch (report.state()) {
            case "INVALID" -> "Has validation errors.";
            case "EXACT_DUPLICATE" -> "Identical content already exists.";
            case "EXTERNAL_ID_EXISTS" -> "An exercise with externalId '" + report.externalId() + "' already exists.";
            default -> "Not importable.";
        };
    }

    // ------------------------------------------------------------------ review workflow

    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = "examExercises", allEntries = true),
            @CacheEvict(cacheNames = "examAdminList", allEntries = true),
            @CacheEvict(cacheNames = "examLevelSummary", allEntries = true)
    })
    public StatusChangeResult changeStatus(StatusChangeRequest request) {
        if (request.ids() == null || request.ids().isEmpty()) throw new IllegalArgumentException("No exercises selected.");
        ExamContentStatus target;
        try {
            target = ExamContentStatus.valueOf(request.status() == null ? "" : request.status().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown status: " + request.status());
        }

        String userId = requestContext.getUserId();
        int updated = 0;
        List<StatusChangeFailure> failures = new ArrayList<>();
        for (ExamExercise e : repository.findAllById(request.ids())) {
            ExamContentStatus current = e.getStatus() != null ? e.getStatus()
                    : (e.isPublished() ? ExamContentStatus.PUBLISHED : ExamContentStatus.DRAFT);
            if (current == target) continue;
            if (!current.canMoveTo(target)) {
                failures.add(new StatusChangeFailure(e.getId(), e.getTitle(), "Cannot move from " + current + " to " + target + "."));
                continue;
            }
            if (target == ExamContentStatus.PUBLISHED) {
                String problem = publishProblem(e);
                if (problem != null) {
                    failures.add(new StatusChangeFailure(e.getId(), e.getTitle(), problem));
                    continue;
                }
            }
            e.applyStatus(target);
            e.setUpdatedBy(userId);
            e.setUpdatedAt(java.time.LocalDateTime.now());
            repository.save(e);
            updated++;
        }
        Set<String> found = new LinkedHashSet<>();
        repository.findAllById(request.ids()).forEach(e -> found.add(e.getId()));
        request.ids().stream().filter(id -> !found.contains(id))
                .forEach(id -> failures.add(new StatusChangeFailure(id, null, "Exercise not found.")));
        return new StatusChangeResult(updated, failures);
    }

    /** Last line of defence against publishing something broken by a hand edit after import. */
    static String publishProblem(ExamExercise e) {
        if (e.getPassages() == null || e.getPassages().isEmpty()) return "Has no texts.";
        if (e.getQuestions() == null || e.getQuestions().isEmpty()) return "Has no questions.";
        if (e.getTaskType() == ExamTaskType.SITUATION_MATCHING) {
            java.util.Set<String> used = new java.util.HashSet<>();
            for (var q : e.getQuestions()) {
                String label = "Situation " + (q.getQuestionNumber() != null ? q.getQuestionNumber() : "?");
                String answer = q.getCorrectAnswer();
                if (answer == null || answer.isBlank()) return label + " has no correct advertisement.";
                if ("X".equalsIgnoreCase(answer)) continue;
                if (e.getPassages().stream().noneMatch(p -> answer.equals(p.getId()))) return label + " refers to an advertisement that does not exist.";
                if (!used.add(answer)) return "An advertisement is the correct answer for more than one situation.";
            }
        }
        if (e.getTaskType() == ExamTaskType.MULTIPLE_CHOICE) {
            for (var q : e.getQuestions()) {
                String label = "Question " + (q.getQuestionNumber() != null ? q.getQuestionNumber() : "?");
                if (q.getOptions() == null || q.getOptions().size() < 2) return label + " has fewer than two options.";
                if (q.getCorrectAnswer() == null || !q.getOptions().contains(q.getCorrectAnswer())) return label + " has no valid correct option.";
            }
        }
        if (e.getTaskType() == ExamTaskType.MATCHING) {
            if (e.getAnswerOptions() == null || e.getAnswerOptions().isEmpty()) return "Has no headings.";
            for (var q : e.getQuestions()) {
                if (q.getCorrectAnswer() == null || !e.getAnswerOptions().contains(q.getCorrectAnswer())) {
                    return "Question " + (q.getQuestionNumber() != null ? q.getQuestionNumber() : "?") + " has no valid correct heading.";
                }
            }
        }
        return null;
    }

    // ------------------------------------------------------------------ export

    public record ExportFile(String filename, String content, int exported, int skipped) {
    }

    @Transactional(readOnly = true)
    public ExportFile export(List<String> ids, ExamType examType, String level, ExamSection section, Integer part,
                             ExamContentStatus status) throws DataNotFoundException {
        List<ExamExercise> selected = (ids == null || ids.isEmpty() ? repository.findAll() : repository.findAllById(ids)).stream()
                .filter(e -> examType == null || e.getExamType() == examType)
                .filter(e -> level == null || level.isBlank() || (e.getLevel() != null && e.getLevel().getValue().equalsIgnoreCase(level)))
                .filter(e -> section == null || e.getSection() == section)
                .filter(e -> part == null || part.equals(e.getPartNumber()))
                .filter(e -> status == null || e.getStatus() == status)
                .sorted(java.util.Comparator.comparing(ExamExercise::getCreatedAt, java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())))
                .toList();
        if (selected.isEmpty()) throw new DataNotFoundException("No exercises match the export selection.");

        List<ExamExercise> exportable = new ArrayList<>();
        List<ObjectNode> nodes = new ArrayList<>();
        for (ExamExercise e : selected) {
            ObjectNode node = ExamContentMapper.toExportNode(objectMapper, e);
            if (node != null) {
                exportable.add(e);
                nodes.add(node);
            }
        }
        if (nodes.isEmpty()) throw new DataNotFoundException("None of the selected exercises can be exported in the import format.");

        ExamExercise first = exportable.get(0);
        boolean homogeneous = exportable.stream().allMatch(e -> e.getExamType() == first.getExamType()
                && e.getLevel() == first.getLevel() && e.getSection() == first.getSection()
                && java.util.Objects.equals(e.getPartNumber(), first.getPartNumber()));

        ObjectNode root = objectMapper.createObjectNode();
        root.put("schemaVersion", ExamContentSpecs.SCHEMA_VERSION);
        root.put("contentType", "EXAM_EXERCISE_BATCH");
        putHeader(root, first);
        ArrayNode array = root.putArray("exercises");
        for (int i = 0; i < nodes.size(); i++) {
            ObjectNode node = nodes.get(i);
            if (!homogeneous) {
                ObjectNode withHeader = objectMapper.createObjectNode();
                putHeader(withHeader, exportable.get(i));
                withHeader.setAll(node);
                node = withHeader;
            }
            array.add(node);
        }

        String name = homogeneous
                ? first.getLevel().getValue() + "-" + ExamContentTokens.sectionLabel(first.getSection()) + "-Teil" + first.getPartNumber()
                : "exam-content";
        String filename = name + "-export-" + LocalDate.now() + ".json";
        try {
            return new ExportFile(filename, objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(root),
                    nodes.size(), selected.size() - nodes.size());
        } catch (com.fasterxml.jackson.core.JsonProcessingException ex) {
            throw new IllegalStateException(ex);
        }
    }

    private static void putHeader(ObjectNode node, ExamExercise e) {
        node.put("exam", e.getExamType().name());
        node.put("level", e.getLevel().getValue());
        node.put("section", ExamContentTokens.sectionToken(e.getSection()));
        node.put("part", ExamContentTokens.partToken(e.getPartNumber()));
    }
}
