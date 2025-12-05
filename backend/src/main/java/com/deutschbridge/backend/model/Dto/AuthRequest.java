package com.deutschbridge.backend.model.Dto;

import lombok.Data;

@Data
public class AuthRequest{
    private String username;
    private String password;
}
