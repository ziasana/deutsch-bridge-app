package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.exception.GlobalExceptionHandler;
import com.deutschbridge.backend.exception.UserVerificationException;
import com.deutschbridge.backend.model.dto.UpdatePasswordRequest;
import com.deutschbridge.backend.model.dto.UserDto;
import com.deutschbridge.backend.model.dto.UserRegistrationRequest;
import com.deutschbridge.backend.model.entity.CustomUserDetails;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.service.EmailService;
import com.deutschbridge.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.willDoNothing;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@Import(GlobalExceptionHandler.class)
@AutoConfigureMockMvc

@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)

class UserControllerTest {

    @Autowired private MockMvc mockMvc;

    @InjectMocks
    private UserController userController;
    @Mock
    private UserService userService;
    @Mock
    private EmailService emailService;

    private UserDto userDto() {
        UserDto dto = new UserDto();
        dto.setEmail("john@example.com");
        dto.setUsername("john");
        dto.setPassword("secret");
        return dto;
    }

    private User user() {
        return new User("john", "john@example.com", "hashed", "STUDENT");
    }

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    // -------------------------------------------------------------------------
    // GET /users
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("GET /users should return list of users")
    void testGetAllUsers() throws Exception {
        when(userService.findAll()).thenReturn(List.of(user()));

        mockMvc.perform(get("/api/user"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].email").value("john@example.com"));
    }

    // -------------------------------------------------------------------------
    // POST /users/register
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("POST /users/register should register user")
    void testRegisterUser() throws Exception {
        when(userService.registerUser(any(UserRegistrationRequest.class))).thenReturn(user());

        mockMvc.perform(post("/api/user/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "email": "john@example.com",
                                    "password": "hashed",
                                    "username": "john",
                                    "role": "STUDENT"
                                }
                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("john@example.com"))
                .andExpect(jsonPath("$.password").isNotEmpty())
                .andExpect(jsonPath("$.username").value("john"));
    }


    // -------------------------------------------------------------------------
    // GET /users/send-mail
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("GET /users/sendMail should trigger email sending")
    void testSendMail() throws Exception {
        willDoNothing().given(emailService)
                .sendVerificationEmail("john@example.com", "token123");

        mockMvc.perform(get("/api/user/send-mail"))
                .andExpect(status().isOk())
                .andExpect(content().string("Email sent successfully"));
    }

    // -------------------------------------------------------------------------
    // POST /users/reset-password
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("POST /users/reset-password → email not found")
    void resetPassword_EmailNotFound() throws Exception {

        // Mock service throwing exception
        when(userService.sendResetLink("john@example.com"))
                .thenThrow(new DataNotFoundException("User not registered yet!"));

        mockMvc.perform(post("/api/user/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            { "email": "john@example.com" }
                            """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message") .value("User not registered yet!"));
    }


    // this test still not completed
    @Test
    @DisplayName("POST /api/user/reset-password → user not verified")
    void resetPassword_UserNotVerified() throws Exception {
        when(userService.sendResetLink("john@example.com"))
                .thenThrow(new UserVerificationException("User is not verified!"));

        mockMvc.perform(post("/api/user/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "email": "john@example.com" }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("User is not verified!"));
    }

    @Test
    @DisplayName("POST /users/reset-password →  should reset send reset link")
    void testResetPasswordSuccess() throws Exception {
        when(userService.sendResetLink("john@example.com")).thenReturn(true);

        mockMvc.perform(post("/api/user/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "email": "john@example.com"
                                }
                """))
                .andExpect(status().isOk())
                .andExpect(content().string("Password reset successfully"));
    }
    // -------------------------------------------------------------------------
    // PUT /users/update-password
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("PUT /users/update-password should update password and return User JSON")
    void testUpdatePassword() throws Exception {
        User updated = new User();
        updated.setPassword("john");
        updated.setEmail("johnt@example.com");
        when(userService.update(any(UserDto.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/user/update-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                              "email": "john@example.com",
                              "password": "newpassword123"
                            }
                            """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("johnt@example.com"))
                .andExpect(jsonPath("$.password").isNotEmpty());
    }


    @Test
    @DisplayName("PUT /users/update-password should return 404 on missing user")
    void testUpdatePassword_UserNotFound() throws Exception {

        User user = new User();
        user.setId("id123");
        user.setEmail("john@example.com");

        Authentication auth =
                new UsernamePasswordAuthenticationToken(user, null, List.of());

        doThrow(new DataNotFoundException("User not found"))
                .when(userService)
                .updatePassword(eq("id123"), anyString());

        mockMvc.perform(
                        put("/api/user/update-password")
                                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication(auth))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                        {
                          "password": "newPassword123",
                          "confirmPassword": "newPassword123"
                        }
                    """)
                )
                .andExpect(status().isNotFound());

        verify(userService).updatePassword(eq("id123"), anyString());
    }

    // -------------------------------------------------------------------------
    // DELETE /users/delete-user
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("DELETE /users/delete-user should return 204")
    void testDeleteUser() throws Exception {
        UserDto dto = userDto();

        when(userService.deleteByEmail(dto)).thenReturn(true);

        mockMvc.perform(delete("/api/user/delete-user")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "email": "john@example.com"
                                }
                      """))
                .andExpect(status().isNoContent());
    }

}