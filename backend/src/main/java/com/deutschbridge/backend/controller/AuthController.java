package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.exception.UserVerificationException;
import com.deutschbridge.backend.model.dto.AuthRequest;
import com.deutschbridge.backend.model.dto.UserDto;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.service.CookieService;
import com.deutschbridge.backend.service.CustomUserService;
import com.deutschbridge.backend.service.UserService;
import com.deutschbridge.backend.util.JWTUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")

//@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")

public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final CustomUserService customUserService;
    private final UserService userService;
    private  final JWTUtil jwtUtil;
    private final CookieService cookieService;

    public AuthController(AuthenticationManager authenticationManager, CustomUserService customUserService, UserService userService, JWTUtil jwtUtil, CookieService cookieService) {
        this.authenticationManager = authenticationManager;
        this.customUserService = customUserService;
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.cookieService = cookieService;
    }

    @PostMapping("/login")
    @ResponseBody
    public ResponseEntity<?> login( @RequestBody AuthRequest authRequest, HttpServletResponse response) throws DataNotFoundException {
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

            //get user data
             UserDetails userDetails= customUserService.loadUserByUsername(authRequest.getUsername());
             UserDto userDto = new UserDto();
             userDto.setUsername(userDetails.getUsername());
             Map<String,Object> dataMap = new HashMap<>();
             dataMap.put("message","Login successful!");
             dataMap.put("user",userDto);

            // return response entity
            return new ResponseEntity<>(dataMap , HttpStatus.OK);

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
