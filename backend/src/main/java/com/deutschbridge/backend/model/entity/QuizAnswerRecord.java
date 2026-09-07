package com.deutschbridge.backend.model.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizAnswerRecord {
    private String questionId;
    private String answer;
    private boolean correct;
}
