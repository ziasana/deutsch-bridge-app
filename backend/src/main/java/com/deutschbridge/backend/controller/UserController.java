package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.exception.UserVerificationException;
import com.deutschbridge.backend.model.dto.UserDto;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.service.CustomUserService;
import com.deutschbridge.backend.service.EmailService;
import com.deutschbridge.backend.service.UserService;
import com.deutschbridge.backend.util.JWTUtil;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;


@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "http://localhost:3000/")
public class UserController {

    private final UserService userService;
    private final EmailService emailService;
    private final CustomUserService customUserService;

    public UserController(UserService userService, EmailService emailService, CustomUserService customUserService) {
        this.userService = userService;
        this.emailService = emailService;
        this.customUserService = customUserService;

    }

    @GetMapping
    public ResponseEntity <List<User>> getAll() {
        return ResponseEntity.ok().body(userService.findAll());
    }

    @PostMapping("/me")
    public ResponseEntity <UserDetails> getMe(@RequestBody UserDto user) {
            return new ResponseEntity<>(customUserService.loadUserByUsername(user.getUsername()), HttpStatus.OK);
    }

    @GetMapping("/send-mail")
    public ResponseEntity <String> sendMail() {
        emailService.sendVerificationEmail("zs.U@gmail.com",
                "S3cJbRs7KKbiwtdHckP1dLB3PkT-ALg7XOq0Y7pd47w"
                );
        return ResponseEntity.ok().body("Email sent successfully");
    }


    @DeleteMapping("/delete-user")
    public ResponseEntity<Boolean> deleteByEmail(@RequestBody UserDto userDto) throws DataNotFoundException {
        return new ResponseEntity<>(userService.deleteByEmail(userDto),HttpStatus.NO_CONTENT);
    }

    @PostMapping("/cookie-test")
    public ResponseEntity<?> cookieTest(@RequestBody User user, HttpServletResponse response) {
        return new ResponseEntity<>("you called me now from test cookie",HttpStatus.OK);
    }
}
