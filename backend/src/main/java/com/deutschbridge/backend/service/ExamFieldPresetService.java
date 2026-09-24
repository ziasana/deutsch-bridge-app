package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExamFieldPresetRequest;
import com.deutschbridge.backend.model.dto.ExamFieldPresetResponse;
import com.deutschbridge.backend.model.entity.ExamFieldPreset;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.ExamFieldPresetRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExamFieldPresetService {

    private static final String NOT_FOUND_MSG = "Preset not found!";

    private final ExamFieldPresetRepository presetRepository;

    public ExamFieldPresetService(ExamFieldPresetRepository presetRepository) {
        this.presetRepository = presetRepository;
    }

    public List<ExamFieldPresetResponse> findBySectionAndLevel(ExamSection section, LearningLevel level) {
        return presetRepository.findBySectionAndLevelOrderByFieldTypeAscLabelAsc(section, level).stream()
                .map(ExamFieldPresetService::toResponse)
                .toList();
    }

    public ExamFieldPresetResponse create(ExamFieldPresetRequest request) {
        validate(request);
        ExamFieldPreset preset = new ExamFieldPreset();
        applyRequest(preset, request);
        return toResponse(presetRepository.save(preset));
    }

    public ExamFieldPresetResponse update(String id, ExamFieldPresetRequest request) throws DataNotFoundException {
        validate(request);
        ExamFieldPreset preset = presetRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
        applyRequest(preset, request);
        return toResponse(presetRepository.save(preset));
    }

    public void delete(String id) throws DataNotFoundException {
        if (!presetRepository.existsById(id)) {
            throw new DataNotFoundException(NOT_FOUND_MSG);
        }
        presetRepository.deleteById(id);
    }

    private void validate(ExamFieldPresetRequest request) {
        if (request.section() == null) {
            throw new IllegalArgumentException("Section is required");
        }
        if (request.level() == null) {
            throw new IllegalArgumentException("Level is required");
        }
        if (request.fieldType() == null) {
            throw new IllegalArgumentException("Field type is required");
        }
        if (request.label() == null || request.label().isBlank()) {
            throw new IllegalArgumentException("Label is required");
        }
        if (request.value() == null || request.value().isBlank()) {
            throw new IllegalArgumentException("Value is required");
        }
    }

    private void applyRequest(ExamFieldPreset preset, ExamFieldPresetRequest request) {
        preset.setSection(request.section());
        preset.setLevel(request.level());
        preset.setFieldType(request.fieldType());
        preset.setLabel(request.label().trim());
        preset.setValue(request.value().trim());
    }

    private static ExamFieldPresetResponse toResponse(ExamFieldPreset p) {
        return new ExamFieldPresetResponse(
                p.getId(),
                p.getSection() != null ? p.getSection().name() : null,
                p.getLevel() != null ? p.getLevel().getValue() : null,
                p.getFieldType() != null ? p.getFieldType().name() : null,
                p.getLabel(),
                p.getValue());
    }
}
