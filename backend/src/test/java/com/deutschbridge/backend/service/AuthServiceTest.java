package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import org.springframework.security.authentication.AuthenticationManager;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @InjectMocks
    private AuthService authService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Test
    @DisplayName("login -> should login a user")
    void testLoginUser() throws Exception {
        String email = "john@example.com";
        String password = "password";
        Authentication mockAuth = mock(Authentication.class);

        when(authenticationManager.authenticate (any(UsernamePasswordAuthenticationToken.class))).thenReturn(mockAuth);

        assertDoesNotThrow(() -> authService.login(email, password));

        verify(authenticationManager).authenticate(argThat(token ->
                token.getPrincipal().equals(email) &&
                        token.getCredentials().equals(password)
        ));
    }

    @Test
    @DisplayName("login -> should throw a bad credential exception")
    void login_failure() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThrows(DataNotFoundException.class,
                () -> authService.login("john@example.com", "wrongpassword"));
    }

}