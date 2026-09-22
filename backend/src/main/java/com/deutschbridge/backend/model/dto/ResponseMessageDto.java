package com.deutschbridge.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ResponseMessageDto {
    private String sessionId;
    private String userId;
    private String content;
    private String role;
    /** Set only when this response created a new session - the AI-generated title for it. */
    private String sessionTitle;
}
