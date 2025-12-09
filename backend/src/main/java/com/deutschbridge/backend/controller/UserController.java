package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.UserVerificationException;
import com.deutschbridge.backend.model.dto.UserDto;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.service.EmailService;
import com.deutschbridge.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;
    private final EmailService emailService;

    public UserController(UserService userService, EmailService emailService) {
        this.userService = userService;
        this.emailService = emailService;
    }

    @GetMapping("/welcome")
    public ResponseEntity <String> welcome() {
        return ResponseEntity.ok().body("Welcome");
    }

    @GetMapping
    public ResponseEntity <String> user() {
        return ResponseEntity.ok().body("Welcome to the user API");
    }

    @PostMapping("/register")
    public ResponseEntity <User> registerUser(@RequestBody UserDto user) throws UserVerificationException {
        return ResponseEntity.ok().body(userService.registerUser(user));
    }

    @GetMapping("/sendMail")
    public ResponseEntity <String> sendMail() throws UserVerificationException {
        emailService.sendVerificationEmail("zs.U@gmail.com",
                "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ6cy5ob3NzYWlueUBnbWFpbC5jb20iLCJhdWQiOiIwIiwiaWF0IjoxNzY1Mjg2MzEzLCJleHAiOjE3NjUyODk5MTN9.S3cJbRs7KKbiwtdHckP1dLB3PkT-ALg7XOq0Y7pd47w"
                );
        return ResponseEntity.ok().body("Email sent successfully");
    }

    @PostMapping("/reset-password")
    public ResponseEntity <String> passwordReset(@RequestBody UserDto user) throws UserVerificationException {
        return ResponseEntity.ok().body(userService.resetPassword(user.getEmail())?"Password reset successfully":"Password reset failed");
    }
}
