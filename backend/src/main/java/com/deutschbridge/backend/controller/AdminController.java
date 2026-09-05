package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.AdminChangePasswordRequest;
import com.deutschbridge.backend.model.dto.AdminUpdateUserRequest;
import com.deutschbridge.backend.model.dto.AdminUserResponse;
import com.deutschbridge.backend.model.dto.ApiResponse;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserResponse>> getAllUsers() {
        List<AdminUserResponse> users = userService.findAll().stream()
                .map(AdminUserResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<AdminUserResponse> getUser(@PathVariable String id) throws DataNotFoundException {
        User user = userService.findById(id);
        return ResponseEntity.ok(AdminUserResponse.fromEntity(user));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateUser(
            @PathVariable String id,
            @RequestBody @Valid AdminUpdateUserRequest request
    ) throws DataNotFoundException {
        User updated = userService.adminUpdateUser(id, request);
        return ResponseEntity.ok(new ApiResponse<>("User updated successfully", AdminUserResponse.fromEntity(updated)));
    }

    @PutMapping("/users/{id}/password")
    public ResponseEntity<ApiResponse<Void>> changeUserPassword(
            @PathVariable String id,
            @RequestBody @Valid AdminChangePasswordRequest request
    ) throws DataNotFoundException {
        userService.updatePassword(id, request.password());
        return ResponseEntity.ok(new ApiResponse<>("Password updated successfully", null));
    }
}
