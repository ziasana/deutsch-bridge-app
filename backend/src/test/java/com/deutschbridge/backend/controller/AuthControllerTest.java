package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.exception.GlobalExceptionHandler;
import com.deutschbridge.backend.exception.UserVerificationException;
import com.deutschbridge.backend.model.AuthUser;
import com.deutschbridge.backend.model.dto.UserRegistrationRequest;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@RunWith(SpringRunner.class)
@ActiveProfiles("test")
@AutoConfigureMockMvc

@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)

class AuthControllerTest {

    @Autowired private MockMvc mockMvc;
    @InjectMocks
    private AuthController authController;
    @Mock
    private UserService userService;
    UserRegistrationRequest userRegistrationRequest;

    private User user() {
        return new User("John", "john@example.com", "hashed" );
    }


    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(authController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        userRegistrationRequest = new UserRegistrationRequest(
                "John", "john@example.com" , "hashed"
        );
    }

    void setupAuthentication() {
        User userEntity = new User("id123", "john@example.com", "hashedpassword");
        AuthUser authUser = new AuthUser(userEntity);

        Authentication auth = new UsernamePasswordAuthenticationToken(
                authUser,
                null,
                authUser.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }


    // -------------------------------------------------------------------------
    // POST /api/user/register
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("POST /api/auth/register -> should register user")
    void testRegisterUser() throws Exception {

        when(userService.registerUser(any(UserRegistrationRequest.class))).thenReturn(user());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                                {
                                                    "displayName": "John",
                                                    "email": "john@example.com",
                                                    "password": "hashed"
                                                }
                                """))

                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.email").value("john@example.com"))
                .andExpect(jsonPath("$.data.password").isNotEmpty())
                .andExpect(jsonPath("$.data.displayName").value("John"));
    }


    // -------------------------------------------------------------------------
    // POST /auth/forgot-password
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("POST /api/auth/forgot-password (Reset Link) -> user email not found")
    void testForgotPassword_EmailNotFound() throws Exception {
        // Mock service throwing exception
        when(userService.sendResetLink("john@example.com"))
                .thenThrow(new DataNotFoundException("User not registered yet!"));

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { 
                                                            "email": "john@example.com" }
                                """))

                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("User not registered yet!"));
    }


    @Test
    @DisplayName("POST /api/auth/forgot-password -> user not verified")
    void testForgotPassword_UserNotVerified() throws Exception {
        when(userService.sendResetLink("john@example.com"))
                .thenThrow(new UserVerificationException("User is not verified!"));

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "email": "john@example.com" }
                                """))

                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("User is not verified!"));
    }

    @Test
    @DisplayName("POST /api/auth/forgot-password -> should reset send reset link")
    void testForgotPasswordSuccess() throws Exception {
        when(userService.sendResetLink("john@example.com")).thenReturn(true);

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "email": "john@example.com"
                                }
                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset successfully"));
    }

    // -------------------------------------------------------------------------
    // PUT /api/user/reset-password
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("PUT /api/auth/rest-password -> should reset password and return User JSON")
    void testResetPassword() throws Exception {
        User updated = new User();
        updated.setPassword("john");
        updated.setEmail("johnt@example.com");
        when(userService.resetPassword(updated.getPassword(), "token123"))
                .thenReturn(updated);

        mockMvc.perform(put("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "password": "newpassword123",
                                   "token": "token123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset successfully"));
    }


    @Test
    @DisplayName("PUT /api/auth/reset-password -> should return 404 on missing user")
    @WithMockUser
    void testResetPassword_UserNotFound() throws Exception {

        // missing password
        String invalidJson = """
                {
                  "password": "",
                  "token": ""
                }
                """;
        mockMvc.perform(
                        put("/api/auth/reset-password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(invalidJson))
                .andExpect(status().isBadRequest());
    }


}