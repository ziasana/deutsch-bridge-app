package com.deutschbridge.backend.util;


import com.deutschbridge.backend.model.dto.*;
import com.deutschbridge.backend.model.entity.*;

import java.util.List;
import java.util.Set;

public class NomenVerbConnectionMapper {
    private NomenVerbConnectionMapper() {
        throw new IllegalStateException("Mapper Utils class");
    }

    public static NomenVerbConnectionResponse mapToNomenVerbConnectionResponse(NomenVerbConnection v) {
        return new NomenVerbConnectionResponse(
                v.getId(),
                v.getWord(),
                v.getExplanation(),
                v.getExample(),
                v.getLevel() != null
                        ? v.getLevel().getValue()
                        : null,
                v.getTags(),
                mapToProgressResponse(v.getLearningProgresses())
        );
    }

    private static List<LearningProgressResponse> mapToProgressResponse(Set<LearningProgress> response) {
        return response.stream()
                .map(c -> new LearningProgressResponse(
                        c.getId(),
                        c.getIsLearned()
                ))
                .toList();
    }

}
