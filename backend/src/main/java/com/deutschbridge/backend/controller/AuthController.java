package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.AuthRequest;
import com.deutschbridge.backend.model.dto.UserDto;
import com.deutschbridge.backend.service.CustomUserService;
import com.deutschbridge.backend.util.JWTUtil;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final CustomUserService customUserService;
    private  final JWTUtil jwtUtil;

    public AuthController(AuthenticationManager authenticationManager, CustomUserService customUserService, JWTUtil jwtUtil) {
        this.authenticationManager = authenticationManager;
        this.customUserService = customUserService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping
    public ResponseEntity<?> login(@RequestBody AuthRequest authRequest) throws DataNotFoundException {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
            );

            //generate JWT
           String token= jwtUtil.generateToken(authRequest.getUsername());

           //create HTTP-only cookie
            ResponseCookie cookie = ResponseCookie.from("jwt", token)
                    .httpOnly(true)
                    .secure(false)
                    .path("/")
                    .sameSite("Lax")
                    .maxAge(3600)
                    .build();

            //get user data
             UserDetails userDetails= customUserService.loadUserByUsername(authRequest.getUsername());
             UserDto userDto = new UserDto();
             userDto.setUsername(userDetails.getUsername());
             Map<String,Object> dataMap = new HashMap<>();
             dataMap.put("message","Login successful!");
             dataMap.put("user",userDto);
            return ResponseEntity.ok()
                   .header(HttpHeaders.SET_COOKIE, cookie.toString())
                   .body(dataMap);

        }catch (Exception e) {
            throw new DataNotFoundException(e.getMessage());
        }
    }
}
