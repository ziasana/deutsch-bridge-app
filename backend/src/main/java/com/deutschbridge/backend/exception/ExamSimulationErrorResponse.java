package com.deutschbridge.backend.exception;

import java.time.LocalDateTime;
import java.util.Map;

public record ExamSimulationErrorResponse(LocalDateTime dateTime, String message, int status, String code, Map<String, Object> details) {
}
