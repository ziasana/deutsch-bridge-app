package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.UserDto;
import com.deutschbridge.backend.model.dto.UserProfileDto;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserProfile;
import com.deutschbridge.backend.service.CustomUserService;
import com.deutschbridge.backend.service.EmailService;
import com.deutschbridge.backend.service.UserProfileService;
import com.deutschbridge.backend.service.UserService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;


@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;
    private final EmailService emailService;
    private final CustomUserService customUserService;
    private final UserProfileService userProfileService;

    public UserController(UserService userService, EmailService emailService, CustomUserService customUserService, UserProfileService userProfileService) {
        this.userService = userService;
        this.emailService = emailService;
        this.customUserService = customUserService;
        this.userProfileService = userProfileService;
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

    @PostMapping("/profile")
    public ResponseEntity<?> saveProfile(@RequestBody UserProfileDto userProfileDto) {
        userProfileService.save(userProfileDto);
        return new ResponseEntity<>(userProfileDto, HttpStatus.OK);
    }

    @GetMapping("/profile")
    public ResponseEntity<UserProfileDto> getProfile(@RequestBody UserProfileDto userProfileDto) {
        User user = userService.findByUsername(userProfileDto.username());
        UserProfile profile = user.getProfile(); // This is loaded eagerly
        UserProfileDto dto= new UserProfileDto(profile.getDisplayName(),null, user.getUsername(),user.getEmail(), profile.getLearningLevel().getValue(), profile.getDailyGoalWords(), profile.isNotificationsEnabled());
        return new ResponseEntity<>(dto, HttpStatus.OK);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody UserProfileDto userProfileDto) {
        userProfileService.update(userProfileDto);
        return new ResponseEntity<>("Profile updated!", HttpStatus.OK);
    }

    @PutMapping("/update-password")
    public ResponseEntity<?> updatePassword(@RequestBody UserDto userDto) throws DataNotFoundException {
        userService.updatePassword(userDto);
        return new ResponseEntity<>("Profile updated!", HttpStatus.OK);
    }

}
