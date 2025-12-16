package com.deutschbridge.backend.model.dto;

public record UserRegistrationDto (
     String  displayName,
     String  email,
     String  password,
     String  username
){
}
