package com.deutschbridge.backend.model.dto;

import java.util.List;

/** `total` is how many Redemittel are due overall (review) or the session size (practice). */
public record RedemittelSessionResponse(List<RedemittelExerciseDto> exercises, long total) {
}
