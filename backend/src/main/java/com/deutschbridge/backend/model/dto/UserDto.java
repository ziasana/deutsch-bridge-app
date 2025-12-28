package com.deutschbridge.backend.model.dto;

import lombok.*;

@Data
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserDto {
        private String  username;
        private String  password;
        private String  email;
        private String  role;
}
