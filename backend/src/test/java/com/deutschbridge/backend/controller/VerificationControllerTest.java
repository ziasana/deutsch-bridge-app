package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.GlobalExceptionHandler;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.repository.UserRepository;
import com.deutschbridge.backend.service.UserService;
import com.deutschbridge.backend.util.JWTUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@Import(GlobalExceptionHandler.class)
@AutoConfigureMockMvc

class VerificationControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @Mock
    private JWTUtil jwtUtil;
    @InjectMocks
    private VerificationController verificationController;
    @Mock
    private UserService userService;

    @Mock
    private UserRepository userRepository; // must exist for verify success

    @Value("${frontend_url}")
    String frontendURL;

    @BeforeEach
    void setup() {

        ReflectionTestUtils.setField(verificationController, "frontendURL", frontendURL);

        mockMvc = MockMvcBuilders
                .standaloneSetup(verificationController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }


    // -------------------------------------------------------------------------
    // GET /req/signup/verify
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /req/signup/verify -> missing token should redirect to error")
    void testVerifyEmail_tokenMissing() throws Exception {

        mockMvc.perform(get("/req/signup/verify"))
               .andExpect(jsonPath("$.message")
                    .value("Required request parameter 'token' for method parameter type String is not present"));
    }


    @Test
    @DisplayName("GET /req/signup/verify -> invalid token should redirect to error")
    void verifyEmail_invalidToken() throws Exception {

        when(jwtUtil.validateToken("bad-token")).thenReturn(false);
        mockMvc.perform(
                        get("/req/signup/verify")
                                .param("token", "bad-token")
                )
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl(
                        frontendURL + "/signup?error=invalid-token"
                ));
      }

    @Test
    @DisplayName("GET /req/signup/verify -> success")
    void testVerifyEmail_success() throws Exception {

        User user = new User();
        user.setEmail("john@example.com");
        user.setVerificationToken("valid-token");
        user.setVerified(false);

        when(jwtUtil.validateToken("valid-token")).thenReturn(true);
        when(jwtUtil.extractEmail("valid-token"))
                .thenReturn("john@example.com");
        when(userService.findByEmail("john@example.com"))
                .thenReturn(user);

        mockMvc.perform(
                        get("/req/signup/verify")
                                .param("token", "valid-token")
                )
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl(
                        frontendURL + "/login?success=registered"
                ));
    }

    // -------------------------------------------------------------------------
    // GET /req/signup/verify
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /req/reset-password -> missing token should redirect to error")
    void handlePasswordReset_tokenMissing() throws Exception {

        mockMvc.perform(get("/req/reset-password"))
                .andExpect(jsonPath("$.message")
                        .value("Required request parameter 'token' for method parameter type String is not present"));
    }

    @Test
    @DisplayName("GET /req/reset-password -> invalid token should redirect to error")
    void handlePasswordReset_invalidToken() throws Exception {
        when(jwtUtil.validateToken("bad-token")).thenReturn(false);
        mockMvc.perform(get("/req/reset-password")
                .param("token", "bad-token"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl(
                        frontendURL + "/reset-password?error=invalid-token"
                ));
    }

    @Test
    @DisplayName("GET /req/reset-password -> invalid token should redirect to error")
    void handlePasswordReset_success() throws Exception {
        when(jwtUtil.validateToken("valid-token")).thenReturn(true);
        mockMvc.perform(get("/req/reset-password")
                        .param("token", "valid-token"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl(
                        frontendURL + "/reset-password/update?token=valid-token"
                ));
    }

}