package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.exception.UserVerificationException;
import com.deutschbridge.backend.model.dto.*;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.service.AuthService;
import com.deutschbridge.backend.service.CookieService;
import com.deutschbridge.backend.service.UserProfileService;
import com.deutschbridge.backend.service.UserService;
import com.deutschbridge.backend.util.JWTUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")

public class AuthController {
    private final AuthService authService;
    private final UserService userService;
    private  final JWTUtil jwtUtil;
    private final CookieService cookieService;
    private final UserProfileService userProfileService;

    public AuthController( AuthService authService, UserService userService, JWTUtil jwtUtil, CookieService cookieService, UserProfileService userProfileService) {
        this.authService = authService;
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.cookieService = cookieService;
        this.userProfileService = userProfileService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserProfileResponse>> login(@RequestBody @Valid LoginRequest request, HttpServletResponse response) throws DataNotFoundException {
        String email = request.getEmail();
        String password = request.getPassword();
        authService.login(email, password);
        //generate access token JWT
        String token = jwtUtil.generateAccessToken(email);
        //generate refresh token JWT
        String refreshToken = jwtUtil.generateRefreshToken(email);
        //save refresh token for user
        userService.saveRefreshToken(email, refreshToken);

        // create and add cookie to response
        response.addCookie(cookieService.createAccessToken(token));
        response.addCookie(cookieService.createRefreshToken(refreshToken));

        // Get user & profile
        User user = userService.findByEmail(email);
        UserProfileResponse userResponse = userProfileService.getUserProfileResponse(user);
        return new ResponseEntity<>(new ApiResponse<>("Login successful!", userResponse), HttpStatus.OK);
    }

    @GetMapping("/refresh")
    public ResponseEntity<ApiResponse<Void>> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        String token= cookieService.extractRefreshToken(request);

        if (token == null || token.isBlank()) {
            // No token - don't call jwtUtil yet
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        //regenerate access token if fresh token is still valid
        if(!jwtUtil.validateToken(token)) {
            throw new AuthenticationCredentialsNotFoundException("Invalid token");
        }

        String email= jwtUtil.extractEmail(token);
        String newAccessToken = jwtUtil.generateAccessToken(email);
        //create cookie
        response.addCookie(cookieService.createAccessToken(newAccessToken));
        return new ResponseEntity<>(new ApiResponse<>("successfully refreshed",null), HttpStatus.OK);
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletResponse response) {
        response.addCookie(cookieService.delete("access_token"));
        response.addCookie(cookieService.delete("refresh_token"));
        return new ResponseEntity<>(new ApiResponse<>("Logged out successfully",null), HttpStatus.OK);
    }

    @PostMapping("/register")
    public ResponseEntity <ApiResponse<User>> registerUser(@RequestBody @Valid UserRegistrationRequest user) throws UserVerificationException {
        return new ResponseEntity<>(new ApiResponse<>(null, userService.registerUser(user)), HttpStatus.CREATED);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity <ApiResponse<Void>> forgotReset(@RequestBody @Valid ForgotPasswordRequest request) throws UserVerificationException, DataNotFoundException {
       String message=  userService.sendResetLink(request.email()) ?
                "Password reset successfully" :
                "Password reset failed";
        return new ResponseEntity<>(
                new ApiResponse<>(message, null ), HttpStatus.OK);
    }

    @PutMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@RequestBody @Valid ResetPasswordRequest request) throws DataNotFoundException, UserVerificationException {

        userService.resetPassword(request.password(), request.token());
        return new ResponseEntity<>(new ApiResponse<>("Password reset successfully", null), HttpStatus.OK);
    }
}
