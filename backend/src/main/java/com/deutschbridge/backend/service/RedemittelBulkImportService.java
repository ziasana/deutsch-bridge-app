package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.AdminRedemittelExerciseDto;
import com.deutschbridge.backend.model.dto.AdminWritingPhraseDto;
import com.deutschbridge.backend.model.dto.RedemittelBulkImportResult;
import com.deutschbridge.backend.model.dto.RedemittelBulkImportRow;
import com.deutschbridge.backend.model.entity.RedemittelFunction;
import com.deutschbridge.backend.repository.RedemittelFunctionRepository;
import com.deutschbridge.backend.repository.WritingPhraseRepository;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

/**
 * Best-effort bulk import of Redemittel: every row is validated and saved on its own, so a mistake in
 * one row never blocks the rest. A row is rejected when a required field is missing, its Funktion does
 * not exist, the same Redemittel already exists on that level, or one of its exercises is invalid.
 */
@Service
public class RedemittelBulkImportService {

    private final WritingContentAdminService contentService;
    private final RedemittelExerciseAdminService exerciseService;
    private final WritingPhraseRepository phraseRepository;
    private final RedemittelFunctionRepository functionRepository;
    private final ObjectMapper objectMapper;

    public RedemittelBulkImportService(WritingContentAdminService contentService, RedemittelExerciseAdminService exerciseService,
                                       WritingPhraseRepository phraseRepository, RedemittelFunctionRepository functionRepository,
                                       ObjectMapper objectMapper) {
        this.contentService = contentService;
        this.exerciseService = exerciseService;
        this.phraseRepository = phraseRepository;
        this.functionRepository = functionRepository;
        this.objectMapper = objectMapper;
    }

    public RedemittelBulkImportResult bulkImport(List<JsonNode> rows) {
        List<RedemittelFunction> functions = functionRepository.findAll();
        List<RedemittelBulkImportResult.Row> results = new ArrayList<>();
        int success = 0;
        for (int i = 0; i < rows.size(); i++) {
            JsonNode node = rows.get(i);
            if (node == null || !node.isObject()) {
                results.add(new RedemittelBulkImportResult.Row(i, null, false, "Each row must be a JSON object.", null));
                continue;
            }
            String phrase = node.hasNonNull("phrase") ? node.get("phrase").asText() : null;
            try {
                RedemittelBulkImportRow row = objectMapper.treeToValue(node, RedemittelBulkImportRow.class);
                String id = importRow(row, functions);
                results.add(new RedemittelBulkImportResult.Row(i, phrase, true, null, id));
                success++;
            } catch (Exception e) {
                results.add(new RedemittelBulkImportResult.Row(i, phrase, false, describeError(e), null));
            }
        }
        return new RedemittelBulkImportResult(rows.size(), success, rows.size() - success, results);
    }

    private String importRow(RedemittelBulkImportRow row, List<RedemittelFunction> functions) throws Exception {
        if (row.phrase() == null || row.phrase().isBlank()) throw new IllegalArgumentException("\"phrase\" is required.");
        if (row.level() == null) throw new IllegalArgumentException("\"level\" is required (A1, A2, B1, B2, C1, or C2).");
        if (row.function() == null || row.function().isBlank()) throw new IllegalArgumentException("\"function\" is required.");
        RedemittelFunction function = findFunction(row.function().strip(), functions);
        if (phraseRepository.existsByLevelAndPhraseIgnoreCase(row.level(), row.phrase().strip())) {
            throw new IllegalArgumentException("This Redemittel already exists on level " + row.level() + ".");
        }
        List<AdminRedemittelExerciseDto> exercises = row.exercises() == null ? List.of() : row.exercises();
        for (int i = 0; i < exercises.size(); i++) {
            try {
                RedemittelExerciseAdminService.toEntity("validate", exercises.get(i), i);
            } catch (ResponseStatusException e) {
                throw new IllegalArgumentException("exercises[" + i + "]: " + e.getReason());
            }
        }

        AdminWritingPhraseDto saved = contentService.createPhrase(new AdminWritingPhraseDto(null, row.level(), function.getId(),
                row.phrase(), row.explanation(), row.example(), row.formality(), row.usageNote(),
                row.sortOrder() == null ? 0 : row.sortOrder(), row.active() == null || row.active(),
                row.meaningEn(), row.meaningFa(), row.grammarPattern(), row.commonMistake(),
                row.similarExpressions() == null ? List.of() : row.similarExpressions(),
                row.contexts() == null ? List.of() : row.contexts()));
        if (!exercises.isEmpty()) exerciseService.replace(saved.id(), exercises);
        return saved.id();
    }

    /** The Funktion by name (case-insensitive) or id. */
    private static RedemittelFunction findFunction(String nameOrId, List<RedemittelFunction> functions) {
        return functions.stream()
                .filter(f -> f.getId().equals(nameOrId) || f.getLabel().equalsIgnoreCase(nameOrId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown function \"" + nameOrId + "\". Create it under Funktionen first."));
    }

    private static String describeError(Exception e) {
        if (e instanceof InvalidFormatException invalid) {
            return "Invalid value \"" + invalid.getValue() + "\" for \"" + describePath(invalid.getPath()) + "\".";
        }
        if (e instanceof IllegalArgumentException) return e.getMessage();
        if (e instanceof ResponseStatusException status) return status.getReason();
        return "Could not import this row: " + e.getMessage();
    }

    private static String describePath(List<JsonMappingException.Reference> path) {
        StringBuilder sb = new StringBuilder();
        for (JsonMappingException.Reference ref : path) {
            if (ref.getFieldName() != null) {
                if (!sb.isEmpty()) sb.append('.');
                sb.append(ref.getFieldName());
            } else if (ref.getIndex() >= 0) {
                sb.append('[').append(ref.getIndex()).append(']');
            }
        }
        return !sb.isEmpty() ? sb.toString() : "a field";
    }
}
