package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.AdminChangeAccountTypeRequest;
import com.deutschbridge.backend.model.dto.AdminChangePasswordRequest;
import com.deutschbridge.backend.model.dto.AdminUpdateUserRequest;
import com.deutschbridge.backend.model.dto.AdminUserResponse;
import com.deutschbridge.backend.model.dto.ApiResponse;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.AccountType;
import com.deutschbridge.backend.service.AdminAuditLogService;
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
    private final AdminAuditLogService adminAuditLogService;
    private final RequestContext requestContext;

    public AdminController(UserService userService, AdminAuditLogService adminAuditLogService, RequestContext requestContext) {
        this.userService = userService;
        this.adminAuditLogService = adminAuditLogService;
        this.requestContext = requestContext;
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

    @PutMapping("/users/{id}/account-type")
    public ResponseEntity<ApiResponse<AdminUserResponse>> changeAccountType(
            @PathVariable String id,
            @RequestBody @Valid AdminChangeAccountTypeRequest request
    ) throws DataNotFoundException {
        User previous = userService.findById(id);
        AccountType newAccountType = AccountType.valueOf(request.accountType());
        User updated = userService.adminChangeAccountType(id, newAccountType);

        adminAuditLogService.record(
                requestContext.getUserId(),
                requestContext.getUserEmail(),
                "USER_ACCOUNT_TYPE_CHANGED",
                "User " + updated.getEmail() + ": " + previous.getAccountType() + " -> " + newAccountType
        );

        return ResponseEntity.ok(new ApiResponse<>("Account type updated successfully", AdminUserResponse.fromEntity(updated)));
    }
}
