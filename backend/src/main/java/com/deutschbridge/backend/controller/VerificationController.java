package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.repository.UserRepository;
import com.deutschbridge.backend.service.UserService;
import com.deutschbridge.backend.util.JWTUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

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
    public RedirectView verifyEmail(@RequestParam("token") String token) {
        String emailString= jwtUtil.extractUsernameOrEmail(token);
        User user= userService.findByEmail(emailString);
        if(emailString==null || user.getVerificationToken()==null) {
            return new RedirectView("http://localhost:3000/signup?error=invalid-token");
        }
        if(!jwtUtil.validateToken(token) || !user.getVerificationToken().equals(token))
        {
            return new RedirectView("http://localhost:3000/signup?error=invalid-token");
        }
        user.setVerificationToken(null);
        user.setVerified(true);
        userRepository.save(user);
        return new RedirectView("http://localhost:3000/login?success=registered");
    }

    @GetMapping("/reset-password")
    public RedirectView handlePasswordReset(@RequestParam("token") String token) {
        if(!jwtUtil.validateToken(token))
            return new RedirectView("http://localhost:3000/reset-password?error=invalid-token");
        return new RedirectView("http://localhost:3000/reset-password/update?token=" + token);
    }
}
