package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.repository.UserRepository;
import com.deutschbridge.backend.service.UserService;
import com.deutschbridge.backend.util.JWTUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("req/")
public class VerificationController {

    private final JWTUtil jwtUtil;
    private final UserService userService;
    private final UserRepository userRepository;
    public VerificationController(JWTUtil jwtUtil, UserService userService, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @GetMapping("/signup/verify")
    public ResponseEntity<String> verifyEmail(@RequestParam("token") String token) {
        String emailString= jwtUtil.extractUsernameOrEmail(token);
        User user= userService.findByEmail(emailString);
        if(emailString==null || user.getVerificationToken()==null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Token Expired!");
        }
        if(!jwtUtil.validateToken(token) || !user.getVerificationToken().equals(token))
        {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Invalid Token!");
        }
        user.setVerificationToken(null);
        user.setVerified(true);
        userRepository.save(user);
        return ResponseEntity.ok().body("Email successfuly Verified!");
    }
}
