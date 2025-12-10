package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.exception.UserVerificationException;
import com.deutschbridge.backend.model.dto.UserDto;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.service.EmailService;
import com.deutschbridge.backend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;
    private final EmailService emailService;

    public UserController(UserService userService, EmailService emailService) {
        this.userService = userService;
        this.emailService = emailService;
    }

    @GetMapping
    public ResponseEntity <List<User>> getAll() {
        return ResponseEntity.ok().body(userService.findAll());
    }

    @PostMapping("/register")
    public ResponseEntity <User> registerUser(@RequestBody UserDto user) throws UserVerificationException {
        return new ResponseEntity<>( userService.registerUser(user), HttpStatus.CREATED);
    }

    @GetMapping("/send-mail")
    public ResponseEntity <String> sendMail() throws UserVerificationException {
        emailService.sendVerificationEmail("zs.U@gmail.com",
                "S3cJbRs7KKbiwtdHckP1dLB3PkT-ALg7XOq0Y7pd47w"
                );
        return ResponseEntity.ok().body("Email sent successfully");
    }

    @PostMapping("/reset-password")
    public ResponseEntity <String> passwordReset(@RequestBody UserDto user) throws UserVerificationException, DataNotFoundException {
        return ResponseEntity.ok().body(userService.resetPassword(user.getEmail()) ? "Password reset successfully" : "Password reset failed");
    }

    @PutMapping("/update-password")
    public ResponseEntity<User> updatePassword(@RequestBody UserDto userDto) throws DataNotFoundException {
        return new ResponseEntity<>(userService.update(userDto), HttpStatus.OK);
    }

    @DeleteMapping("/delete-user")
    public ResponseEntity<Boolean> deleteByEmail(@RequestBody UserDto userDto) throws DataNotFoundException {
        return new ResponseEntity<>(userService.deleteByEmail(userDto),HttpStatus.NO_CONTENT);
    }
}
