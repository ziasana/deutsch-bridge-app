package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.GlobalExceptionHandler;
import com.deutschbridge.backend.model.AuthUser;
import com.deutschbridge.backend.model.dto.UserDto;
import com.deutschbridge.backend.model.entity.User;
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

}