package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.LearningActivity;
import com.deutschbridge.backend.model.enums.LearningActivityType;
import com.deutschbridge.backend.model.enums.LearningModule;
import com.deutschbridge.backend.repository.LearningActivityRepository;
import org.springframework.stereotype.Service;

/**
 * Records one {@link LearningActivity} row per genuine learning action. Called only from the
 * backend service that already owns the completion (never from a controller reacting to a page
 * view), so retries/duplicate requests can't inflate the count - see each call site.
 */
@Service
public class LearningActivityService {

    private final LearningActivityRepository learningActivityRepository;

    public LearningActivityService(LearningActivityRepository learningActivityRepository) {
        this.learningActivityRepository = learningActivityRepository;
    }

    public void track(String userId, LearningModule module, LearningActivityType activityType, String entityId) {
        if (userId == null) return;
        LearningActivity activity = new LearningActivity();
        activity.setUserId(userId);
        activity.setModule(module);
        activity.setActivityType(activityType);
        activity.setEntityId(entityId);
        learningActivityRepository.save(activity);
    }
}
