package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.AuthUser;
import com.deutschbridge.backend.model.dto.*;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserProfile;
import com.deutschbridge.backend.service.CustomUserDetailsService;
import com.deutschbridge.backend.service.EmailService;
import com.deutschbridge.backend.service.UserProfileService;
import com.deutschbridge.backend.service.UserService;
import com.deutschbridge.backend.util.SecurityUtils;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;


@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;
    private final EmailService emailService;
    private final CustomUserDetailsService customUserDetailsService;
    private final UserProfileService userProfileService;

    public UserController(UserService userService, EmailService emailService, CustomUserDetailsService customUserDetailsService, UserProfileService userProfileService) {
        this.userService = userService;
        this.emailService = emailService;
        this.customUserDetailsService = customUserDetailsService;
        this.userProfileService = userProfileService;
    }

    @GetMapping
    public ResponseEntity <List<User>> getAll() {
        return ResponseEntity.ok().body(userService.findAll());
    }

    @GetMapping("/me")
    public ResponseEntity<User> me() {
        String userEmail = SecurityUtils.getAuthenticatedEmail();
        User user = userService.findByEmail(userEmail);
        return new ResponseEntity<>(user, HttpStatus.OK);
    }

    @DeleteMapping("/delete-user")
    public ResponseEntity<Boolean> deleteByEmail(@RequestBody UserDto userDto) throws DataNotFoundException {
        return new ResponseEntity<>(userService.deleteByEmail(userDto),HttpStatus.NO_CONTENT);
    }

    @PostMapping("/cookie-test")
    public ResponseEntity<?> cookieTest(@RequestBody User user, HttpServletResponse response) {
        return new ResponseEntity<>("you called me now from test cookie",HttpStatus.OK);
    }

    @PostMapping("/save-profile")
    public ResponseEntity<?> saveProfile(@RequestBody UserProfileResponse userProfileResponse) {
        userProfileService.save(userProfileResponse);
        return new ResponseEntity<>(userProfileResponse, HttpStatus.OK);
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(@AuthenticationPrincipal AuthUser authUser) {
        User user = userService.findByEmail(authUser.getId());
        UserProfile profile = user.getProfile(); // This is loaded eagerly
        UserProfileResponse response= new UserProfileResponse(
                user.getDisplayName(),
                user.getEmail(),
                profile.getLearningLevel().getValue(),
                profile.getDailyGoalWords(),
                profile.isNotificationsEnabled());
        return new ResponseEntity<>(
                new ApiResponse<>("Profile loaded", response), HttpStatus.OK);
    }

    @PutMapping("/update-profile")
    public ResponseEntity<ApiResponse<Void>> updateProfile(@RequestBody UserProfileRequest request,  @AuthenticationPrincipal AuthUser authUser) {
        userProfileService.update(authUser.getId(), request);
        return new ResponseEntity<>(
                new ApiResponse<>("Profile updated successfully", null), HttpStatus.OK);
    }

    @PutMapping("/update-password")
    public ResponseEntity<ApiResponse<Void>> updatePassword(@RequestBody @Valid UpdatePasswordRequest request,
                                                            @AuthenticationPrincipal AuthUser authUser
    ) throws DataNotFoundException {
        userService.updatePassword(authUser.getId(), request.password());
        return new ResponseEntity<>(
                new ApiResponse<>("Password updated successfully", null), HttpStatus.OK);
    }


}
