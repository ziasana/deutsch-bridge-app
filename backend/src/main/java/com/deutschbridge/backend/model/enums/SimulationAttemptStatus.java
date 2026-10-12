package com.deutschbridge.backend.model.enums;

public enum SimulationAttemptStatus {
    IN_PROGRESS, COMPLETED, EXPIRED, CANCELLED;

    public boolean isFinished() {
        return this != IN_PROGRESS;
    }
}
