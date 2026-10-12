package com.deutschbridge.backend.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.util.Map;

/** Business-rule failure of the exam simulation with a stable, machine-readable code for the client. */
@Getter
public class ExamSimulationException extends RuntimeException {

    private final transient String code;
    private final transient HttpStatus status;
    private final transient Map<String, Object> details;

    public ExamSimulationException(HttpStatus status, String code, String message, Map<String, Object> details) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details != null ? details : Map.of();
    }

    public ExamSimulationException(HttpStatus status, String code, String message) {
        this(status, code, message, Map.of());
    }

    public static ExamSimulationException conflict(String code, String message) {
        return new ExamSimulationException(HttpStatus.CONFLICT, code, message);
    }

    public static ExamSimulationException conflict(String code, String message, Map<String, Object> details) {
        return new ExamSimulationException(HttpStatus.CONFLICT, code, message, details);
    }

    public static ExamSimulationException badRequest(String code, String message) {
        return new ExamSimulationException(HttpStatus.BAD_REQUEST, code, message);
    }
}
