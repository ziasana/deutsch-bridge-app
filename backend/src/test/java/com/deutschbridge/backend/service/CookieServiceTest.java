package com.deutschbridge.backend.service;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(SpringExtension.class)
class CookieServiceTest {

    @InjectMocks
    private CookieService cookieService;

    @Test
    @DisplayName("createAccessToken -> should not be null")
    void testCreateAccessToken() {
        String token = UUID.randomUUID().toString();
        Cookie result = cookieService.createAccessToken(token);
        assertNotNull(result);
    }

    @Test
    @DisplayName("createRefreshToken -> should not be null")
    void testCreateRefreshToken() {
        String token = UUID.randomUUID().toString();
        Cookie result = cookieService.createRefreshToken(token);
        assertNotNull(result);
    }

    @Test
    @DisplayName("createCookie -> should not be null and valid for 7 days")
    void testCreateCookie() {
        String name = "authToken";
        String token = "abc123";

        Cookie cookie = cookieService.create(name, token);

        assertNotNull(cookie);
        assertEquals(name, cookie.getName());
        assertEquals(token, cookie.getValue());
        assertEquals(7 * 24 * 60 * 60, cookie.getMaxAge());
        assertEquals("/", cookie.getPath());
        assertTrue(cookie.isHttpOnly());
        assertFalse(cookie.getSecure());
    }


    @Test
    @DisplayName("extractAccessToken -> token should not be null")
    void testExtractAccessToken_success() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        Cookie[] cookies = {
                new Cookie("access_token", "token1234"),
                new Cookie("refresh_token", "token456")
        };

        when(request.getCookies()).thenReturn(cookies);

        String token = cookieService.extractAccessToken(request);
        assertNotNull(token);
        assertEquals("token1234", token);
    }

    @Test
    @DisplayName("extractAccessToken -> token is not found")
    void testExtractAccessToken_notFound() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        Cookie[] cookies = {
                new Cookie("test_token", "token1234")
        };

        when(request.getCookies()).thenReturn(cookies);
        String token = cookieService.extractAccessToken(request);
        assertNull(token);
    }

    @Test
    @DisplayName("extractRefreshToken -> should extract refresh token from cookie")
    void testExtractRefreshToken() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        Cookie[] cookies = {
                new Cookie("access_token", "token1234"),
                new Cookie("refresh_token", "token456")
        };

        when(request.getCookies()).thenReturn(cookies);

        String token = cookieService.extractRefreshToken(request);
        assertNotNull(token);
        assertEquals("token456", token);
    }

    @Test
    @DisplayName("extractTokenFromCookie -> should extract token from cookie")
    void testExtractTokenFromCookie() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        Cookie[] cookies = {
                new Cookie("access_token", "token1234"),
                new Cookie("refresh_token", "token456")
        };

        when(request.getCookies()).thenReturn(cookies);
        String token = cookieService.extractTokenFromCookie("access_token", request);
        assertNotNull(token);
        assertEquals("token1234", token);
    }

    @Test
    @DisplayName("delete -> delete token from cookie")
    void testDelete() {
        String name = "access_token";

        Cookie cookie = cookieService.delete(name);

        assertNotNull(cookie);
        assertNotNull(name);
        assertEquals("",cookie.getValue());
        assertEquals(0, cookie.getMaxAge());
        assertEquals("/", cookie.getPath());
    }
}