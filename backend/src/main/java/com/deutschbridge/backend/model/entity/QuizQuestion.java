package com.deutschbridge.backend.model.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizQuestion {
    private String type; // mcq, fill, truefalse
    private String title;
    private String question;
    private List<String> options; // optional, only for MCQ
    private Object answer; // String for mcq/fill, Boolean for truefalse
}
