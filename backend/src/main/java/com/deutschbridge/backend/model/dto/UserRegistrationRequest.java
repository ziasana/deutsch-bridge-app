package com.deutschbridge.backend.model.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserRegistrationRequest {

        @NotBlank(message = "Display Name is required")
        @Size(min = 3, message = "Password must be at least 3 characters")
        private String  displayName;

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        private String  email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;
}
