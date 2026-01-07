package com.deutschbridge.backend.model.dto;

import java.util.List;

public record OllamaRequest(String model,
                            boolean stream,
                            List<OllamaMessage> messages)
{
    public OllamaRequest( List<OllamaMessage> messages)
    {
      this("gpt-oss:120b",false, messages );

    }

}
