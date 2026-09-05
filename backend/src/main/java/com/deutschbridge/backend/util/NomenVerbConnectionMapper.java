package com.deutschbridge.backend.util;


import com.deutschbridge.backend.model.dto.*;
import com.deutschbridge.backend.model.entity.*;

import java.util.List;

public class NomenVerbConnectionMapper {
    private NomenVerbConnectionMapper() {
        throw new IllegalStateException("Mapper Utils class");
    }

    /**
     * userProgress must already be scoped to the current authenticated user
     * (see NomenVerbConnectionService) - never pass the entity's own
     * learningProgresses collection here, as it holds every user's progress.
     */
    public static NomenVerbConnectionResponse mapToNomenVerbConnectionResponse(NomenVerbConnection v, LearningProgress userProgress) {
        return new NomenVerbConnectionResponse(
                v.getId(),
                v.getWord(),
                v.getExplanation(),
                v.getExample(),
                v.getLevel() != null
                        ? v.getLevel().getValue()
                        : null,
                v.getTags(),
                userProgress != null
                        ? List.of(new LearningProgressResponse(userProgress.getId(), Boolean.TRUE.equals(userProgress.getIsLearned())))
                        : List.of()
        );
    }

}
