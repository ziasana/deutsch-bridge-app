package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.exception.GlobalExceptionHandler;
import com.deutschbridge.backend.model.AuthUser;
import com.deutschbridge.backend.model.dto.UpdatePasswordRequest;
import com.deutschbridge.backend.model.dto.UserDto;
import com.deutschbridge.backend.model.dto.UserProfileRequest;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.service.UserProfileService;
import com.deutschbridge.backend.service.UserService;
import org.junit.jupiter.api.*;
import org.junit.runner.RunWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


@SpringBootTest
@RunWith(SpringRunner.class)
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
    private UserProfileService userProfileService;

    private User user() {
        return new User("john", "john@example.com", "hashed" );
    }

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    void setupAuthentication() {
        User userEntity = new User("id123", "john@example.com", "hashedpassword");
        AuthUser authUser = new AuthUser(userEntity);
        authUser.setId("user123");

        Authentication auth = new UsernamePasswordAuthenticationToken(
                authUser,
                null,
                authUser.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
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
    // GET /users
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("GET /me should return user details")
    //@WithMockUser(username = "john@example.com")
    void testMe() throws Exception {
        setupAuthentication();
        when(userService.findByEmail(user().getEmail())).thenReturn(user());
        mockMvc.perform(get("/api/user/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("john@example.com"));
    }

    // -------------------------------------------------------------------------
    // DELETE /users/delete-user
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("DELETE /users/delete-user should return 204")
    void testDeleteUser() throws Exception {

        UserDto userDto = new UserDto();
        userDto.setEmail("john@example.com");
        userDto.setPassword("hashed");
        when(userService.deleteByEmail(userDto)).thenReturn(true);

        mockMvc.perform(delete("/api/user/delete-user")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "email": "john@example.com"
                                }
                      """))
                .andExpect(status().isNoContent());
    }

    // -------------------------------------------------------------------------
    // PUT /users/update-password
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("UPDATE /users/update-password should return success message")
    void testUpdatePassword() throws Exception {
        setupAuthentication();
        UpdatePasswordRequest request = new UpdatePasswordRequest("newPassword");
        when(userService.updatePassword(anyString(), eq(request.password()))).thenReturn(true);
        mockMvc.perform(put("/api/user/update-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                          {
                                              "id": "user123",
                                              "password": "newPassword"
                                          }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password updated successfully"));

    }

    @Test
    @DisplayName("UPDATE /users/update-password should throw bad request")
    void testUpdatePassword_UserNotFound() throws Exception {
        setupAuthentication();
        mockMvc.perform(put("/api/user/update-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                          {
                                              "id": "",
                                              "password": "newPassword"
                                          }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Password not updated"));

    }

    // -------------------------------------------------------------------------
    // PUT /users/update-profile
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("UPDATE /users/update-profile should return success message")
    void testUpdateProfile() throws Exception {
        setupAuthentication();
           when(userProfileService.update(anyString(), any(UserProfileRequest.class))).thenReturn(true);
        mockMvc.perform(put("/api/user/update-profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                          {
                                              "displayName": "john",
                                              "learningLevel": "A1",
                                              "dailyGoalWords": 10,
                                              "notificationEnabled": false
                                          }
                                """))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.message").value("Profile updated successfully"));
    }

    @Test
    @DisplayName("UPDATE /users/update-profile should throw user not found")
    void testUpdateProfile_UserNotFound() throws Exception {
        setupAuthentication();
        when(userProfileService.update(anyString(), any(UserProfileRequest.class)))
                .thenThrow(new DataNotFoundException("User not found"));

        mockMvc.perform(put("/api/user/update-profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                          {
                                              "displayName": "john",
                                              "learningLevel": "A1",
                                              "dailyGoalWords": 10,
                                              "notificationEnabled": false
                                          }
                                """))

                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("User not found"));
    }

}