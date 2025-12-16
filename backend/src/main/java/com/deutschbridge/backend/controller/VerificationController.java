package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.model.dto.TokenRequest;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.repository.UserRepository;
import com.deutschbridge.backend.service.UserService;
import com.deutschbridge.backend.util.JWTUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

@RestController
@RequestMapping("req/")
public class VerificationController {

    @Value("${frontend_url}")
    private String frontendURL;
    private final JWTUtil jwtUtil;
    private final UserService userService;
    private final UserRepository userRepository;

    public VerificationController(JWTUtil jwtUtil, UserService userService, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @GetMapping("/signup/verify")
    public RedirectView verifyEmail(@RequestParam("token") TokenRequest request) {

        String token = request.token();
        if(token == null) {
            return getRedirectErrorView("/signup");
        }
        if(!jwtUtil.validateToken(token))
        {
            return getRedirectErrorView("/signup");
        }

        User user= userService.findByEmail(jwtUtil.extractEmail(token));
        if(user.getVerificationToken() == null) {
            return getRedirectErrorView("/signup");
        }

        user.setVerificationToken(null);
        user.setVerified(true);
        userRepository.save(user);
        return getRedirectView("/login?success=registered");
    }

    private RedirectView getRedirectErrorView(String path) {
        return new RedirectView(frontendURL + path + "?error=invalid-token");
    }
    private RedirectView getRedirectView(String path) {
        return new RedirectView(frontendURL + path);
    }

    @GetMapping("/reset-password")
    public RedirectView handlePasswordReset(@RequestParam("token") TokenRequest request) {
        String token = request.token();
        if(token == null) {
            return getRedirectErrorView("/reset-password");
        }
        if(!jwtUtil.validateToken(token))
            return getRedirectErrorView("/reset-password");
        return getRedirectView( "/reset-password/update?token=" + token);
    }
}
