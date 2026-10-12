package com.deutschbridge.backend.service.examsim;

import java.util.List;

/** Errors block publication; warnings are shown to the admin but do not. */
public record ProfileValidationResult(List<Issue> errors, List<Issue> warnings) {

    public record Issue(String code, String path, String message) {
    }

    public boolean isValid() {
        return errors.isEmpty();
    }
}
