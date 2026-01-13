package com.deutschbridge.backend.util;

import com.deutschbridge.backend.repository.UserRepository;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class JWTUtilTest {


    UserRepository userRepository;
    private JWTUtil jwtUtil;
    String testSecret = "01234567890123456789012345678901";

    @BeforeEach
    void setup() {
        userRepository = mock(UserRepository.class);
        jwtUtil = new JWTUtil(
                userRepository,
                testSecret,
                1000L * 60 * 60,        // 1h access
                1000L * 60 * 60 * 24,   // 24h refresh
                1000L * 60 * 30         // 30min verification
        );

    }

    // ---------------------------------------------------------------
    // generateAccessToken
    // ---------------------------------------------------------------
    @Test
    @DisplayName("generateAccessToken -> should generate access token")
    void generateAccessToken_shouldContainEmailAndTokenVersion() {
        String email = "test@example.com";

        when(userRepository.incrementAndGetAccessTokenFlag(email)).thenReturn(1);
        when(userRepository.getAccessTokenFlag(email)).thenReturn(1);

        String token = jwtUtil.generateAccessToken(email);
        assertNotNull(token);

        Claims claims = jwtUtil.extractClaims(token);
        assertEquals(email, claims.getSubject());
        assertEquals("ACCESS_TOKEN", claims.get("type"));
        assertEquals(1, claims.get("tokenVersion"));
    }


    // ---------------------------------------------------------------
    // generateRefreshToken
    // ---------------------------------------------------------------
    @Test
    @DisplayName("generateRefreshToken -> should generate refresh token")
    void generateRefreshToken_shouldContainEmail() {
        String email = "test@example.com";

        String token = jwtUtil.generateRefreshToken(email);
        assertNotNull(token);

        Claims claims = jwtUtil.extractClaims(token);
        assertEquals(email, claims.getSubject());
        assertNull(claims.get("type"));
        assertNull(claims.get("tokenVersion"));
    }

    // ---------------------------------------------------------------
    // extractEmail
    // ---------------------------------------------------------------
    @Test
    @DisplayName("extractEmail -> should extract email address")
    void extractEmail_shouldReturnCorrectEmail() {
        String email = "user@test.com";
        String token = jwtUtil.generateVerificationToken(email);

        String extracted = jwtUtil.extractEmail(token);
        assertEquals(email, extracted);
    }

    // ---------------------------------------------------------------
    // validateToken
    // ---------------------------------------------------------------
    @Test
    @DisplayName("validateToken -> should validate token")
    void validateToken_withUserDetails_shouldReturnTrue() {
        String email = "test@example.com";
        when(userRepository.incrementAndGetAccessTokenFlag(email)).thenReturn(1);
        when(userRepository.getAccessTokenFlag(email)).thenReturn(1);

        String token = jwtUtil.generateAccessToken(email);

        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn(email);

        assertTrue(jwtUtil.validateToken(email, userDetails, token));
    }
}