package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.exception.UserVerificationException;
import com.deutschbridge.backend.model.dto.AuthRequest;
import com.deutschbridge.backend.model.dto.UserDto;
import com.deutschbridge.backend.model.dto.UserProfileDto;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserProfile;
import com.deutschbridge.backend.service.CookieService;
import com.deutschbridge.backend.service.UserService;
import com.deutschbridge.backend.util.JWTUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")

public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private  final JWTUtil jwtUtil;
    private final CookieService cookieService;

    public AuthController(AuthenticationManager authenticationManager, UserService userService, JWTUtil jwtUtil, CookieService cookieService) {
        this.authenticationManager = authenticationManager;
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.cookieService = cookieService;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody AuthRequest authRequest, HttpServletResponse response) throws DataNotFoundException {
       try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
            );

            //generate access token JWT
            String token= jwtUtil.generateAccessToken(authRequest.getUsername());
            //generate refresh token JWT
            String refreshToken = jwtUtil.generateRefreshToken(authRequest.getUsername());
            //save refresh token for user
            userService.saveRefreshToken(authRequest.getUsername(), refreshToken);

            // create and add cookie to response
            response.addCookie(cookieService.createAccessToken(token));
            response.addCookie(cookieService.createRefreshToken(refreshToken));

           // Get user & profile
           User user = userService.findByUsername(authRequest.getUsername());
           UserProfile profile = user.getProfile();

           // Build DTO
           UserProfileDto userDto = new UserProfileDto(
                   profile != null ? profile.getDisplayName() : null,
                   null,
                   user.getUsername(),
                   user.getEmail(),
                   profile != null ? profile.getLearningLevel().getValue() : null,
                   profile != null ? profile.getDailyGoalWords() : null,
                   profile != null && profile.isNotificationsEnabled()
           );

           // Build response
           Map<String, Object> data = Map.of(
                   "message", "Login successful!",
                   "user", userDto
           );

           return ResponseEntity.ok(data);

        }catch (Exception e) {
            throw new DataNotFoundException(e.getMessage());
        }


    }

    @GetMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        String token= cookieService.extractRefreshToken(request);

        if (token == null || token.isBlank()) {
            // No token - don't call jwtUtil yet
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        //regenerate access token if fresh token is still valid
        if(!jwtUtil.validateToken(token)) {
            throw new AuthenticationCredentialsNotFoundException("Invalid token");
        }

        String username= jwtUtil.extractUsernameOrEmail(token);
        String newAccessToken = jwtUtil.generateAccessToken(username);
        //create cookie
        response.addCookie(cookieService.createAccessToken(newAccessToken));
        return new ResponseEntity<>("successfully refreshed" , HttpStatus.OK);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        response.addCookie(cookieService.delete("access_token"));
        response.addCookie(cookieService.delete("refresh_token"));
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @PostMapping("/register")
    public ResponseEntity <User> registerUser(@RequestBody UserDto user) throws UserVerificationException {
        return new ResponseEntity<>( userService.registerUser(user), HttpStatus.CREATED);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity <String> forgotReset(@RequestBody UserDto user) throws UserVerificationException, DataNotFoundException {
        return ResponseEntity.ok().body(userService.forgotPassword(user.getEmail()) ? "Password reset successfully" : "Password reset failed");
    }

    @PutMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody Map<String,String> body) throws DataNotFoundException, UserVerificationException {
        userService.resetPassword(body.get("password"), body.get("token"));
        return new ResponseEntity<>("Password rested successfully", HttpStatus.OK);
    }
}
