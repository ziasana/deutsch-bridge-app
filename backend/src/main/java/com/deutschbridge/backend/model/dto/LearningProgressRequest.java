package com.deutschbridge.backend.model.dto;

public record LearningProgressRequest(
                                      String lessonId,
                                      String nomenVerbId,
                                      boolean learned)
{

}
