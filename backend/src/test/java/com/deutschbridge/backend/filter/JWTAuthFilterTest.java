package com.deutschbridge.backend.filter;

import com.deutschbridge.backend.service.CookieService;
import com.deutschbridge.backend.service.CustomUserDetailsService;
import com.deutschbridge.backend.util.JWTUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import static org.mockito.Mockito.*;

class JWTAuthFilterTest {

    private JWTAuthFilter filter;
    private JWTUtil jwtUtil;
    private CustomUserDetailsService userDetailsService;
    private CookieService cookieService;

    private HttpServletRequest request;
    private HttpServletResponse response;
    private FilterChain filterChain;

    @BeforeEach
    void setup() {
        jwtUtil = mock(JWTUtil.class);
        userDetailsService = mock(CustomUserDetailsService.class);
        cookieService = mock(CookieService.class);

        filter = new JWTAuthFilter(jwtUtil, userDetailsService, cookieService);

        request = mock(HttpServletRequest.class);
        response = mock(HttpServletResponse.class);
        filterChain = mock(FilterChain.class);

        // Clear security context before each test
        SecurityContextHolder.clearContext();
    }

    // ---------------------------------------------------------------
    // doFilterInternal
    // ---------------------------------------------------------------
    @DisplayName("doFilterInternal -> should skip filter for login path")
    @Test
    void testDoFilterInternal_shouldSkipFilterForLoginPath() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/auth/login");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        verifyNoInteractions(jwtUtil, userDetailsService, cookieService);
    }

    // ---------------------------------------------------------------
    // doFilterInternal
    // ---------------------------------------------------------------
    @DisplayName("doFilterInternal -> should skip filter for registration path")
    @Test
    void testDoFilterInternal_shouldSkipFilterForRegistrationPath() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/auth/register");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        verifyNoInteractions(jwtUtil, userDetailsService, cookieService);
    }

    // ---------------------------------------------------------------
    // doFilterInternal
    // ---------------------------------------------------------------
    @DisplayName("doFilterInternal -> should skip filter for refresh path")
    @Test
    void testDoFilterInternal_shouldSkipFilterForRefreshPath() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/auth/refresh");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        verifyNoInteractions(jwtUtil, userDetailsService, cookieService);
    }


    // ---------------------------------------------------------------
    // doFilterInternal
    // ---------------------------------------------------------------
    @DisplayName("doFilterInternal -> should skip filter for forgot password path")
    @Test
    void testDoFilterInternal_shouldSkipFilterForForgotPasswordPath() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/auth/forgot-password");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        verifyNoInteractions(jwtUtil, userDetailsService, cookieService);
    }

    // ---------------------------------------------------------------
    // doFilterInternal
    // ---------------------------------------------------------------
    @DisplayName("doFilterInternal -> should skip filter for reset password path")
    @Test
    void testDoFilterInternal_shouldSkipFilterForResetPasswordPath() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/auth/reset-password");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        verifyNoInteractions(jwtUtil, userDetailsService, cookieService);
    }

    // ---------------------------------------------------------------
    // doFilterInternal
    // ---------------------------------------------------------------
    @DisplayName("doFilterInternal -> should skip filter for verify path")
    @Test
    void testDoFilterInternal_shouldSkipFilterForVerifyPath() throws Exception {
        when(request.getRequestURI()).thenReturn("/req/signup/verify");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        verifyNoInteractions(jwtUtil, userDetailsService, cookieService);
    }


    // ---------------------------------------------------------------
    // doFilterInternal
    // ---------------------------------------------------------------
    @DisplayName("doFilterInternal -> should return 401 if token is missing")
    @Test
    void testDoFilterInternal_shouldReturn401IfTokenMissing() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/protected/resource");
        when(cookieService.extractAccessToken(request)).thenReturn(null);

        filter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        verify(filterChain, never()).doFilter(request, response);
    }

    // ---------------------------------------------------------------
    // doFilterInternal
    // ---------------------------------------------------------------
    @DisplayName("doFilterInternal -> should return 401 if token is invalid")
    @Test
    void testDoFilterInternal_shouldReturn401IfTokenInvalid() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/protected/resource");
        when(cookieService.extractAccessToken(request)).thenReturn("token");
        when(jwtUtil.extractEmail("token")).thenThrow(new RuntimeException());

        filter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        verify(filterChain, never()).doFilter(request, response);
    }

    // ---------------------------------------------------------------
    // doFilterInternal
    // ---------------------------------------------------------------
    @DisplayName("doFilterInternal -> should authenticate user if token is valid")
    @Test
    void testDoFilterInternal_shouldAuthenticateUserIfTokenValid() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/protected/resource");
        when(cookieService.extractAccessToken(request)).thenReturn("token");
        when(jwtUtil.extractEmail("token")).thenReturn("user@example.com");

        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getAuthorities()).thenReturn(null);
        when(userDetailsService.loadUserByUsername("user@example.com")).thenReturn(userDetails);
        when(jwtUtil.validateToken("user@example.com", userDetails, "token")).thenReturn(true);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        assert(SecurityContextHolder.getContext().getAuthentication() != null);
    }

}