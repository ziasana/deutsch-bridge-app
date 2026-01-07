package com.deutschbridge.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;


@Setter
@Getter
@AllArgsConstructor
public class OllamaMessage {
    private String role;
    private String content;

}
