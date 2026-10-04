package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.UserVerificationException;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.AuthProvider;
import com.deutschbridge.backend.repository.UserProfileRepository;
import com.deutschbridge.backend.repository.UserRepository;
import com.deutschbridge.backend.service.GoogleTokenVerifier.GoogleIdentity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GoogleAuthServiceTest {

    @Mock private GoogleTokenVerifier tokenVerifier;
    @Mock private UserRepository userRepository;
    @Mock private UserProfileRepository userProfileRepository;
    @InjectMocks private GoogleAuthService service;

    private GoogleIdentity identity(boolean emailVerified) {
        return new GoogleIdentity("g-1", "Jane@Example.com", emailVerified, "Jane Doe", "http://pic");
    }

    @Test
    @DisplayName("authenticate -> invalid token is rejected")
    void invalidToken() {
        when(tokenVerifier.verify("bad")).thenReturn(Optional.empty());
        assertThrows(UserVerificationException.class, () -> service.authenticate("bad"));
        verifyNoInteractions(userRepository);
    }

    @Test
    @DisplayName("authenticate -> unverified Google email is rejected")
    void unverifiedEmail() {
        when(tokenVerifier.verify("t")).thenReturn(Optional.of(identity(false)));
        assertThrows(UserVerificationException.class, () -> service.authenticate("t"));
    }

    @Test
    @DisplayName("authenticate -> creates a verified, password-less GOOGLE user")
    void createsNewUser() throws Exception {
        when(tokenVerifier.verify("t")).thenReturn(Optional.of(identity(true)));
        when(userRepository.findByGoogleId("g-1")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.empty());

        GoogleAuthService.Result result = service.authenticate("t");

        assertTrue(result.newUser());
        User u = result.user();
        assertEquals("jane@example.com", u.getEmail());
        assertEquals(AuthProvider.GOOGLE, u.getAuthProvider());
        assertNull(u.getPassword());
        assertTrue(u.isVerified());
        assertEquals("g-1", u.getGoogleId());
        verify(userRepository).save(u);
        verify(userProfileRepository).save(any());
    }

    @Test
    @DisplayName("authenticate -> links an existing email/password account and keeps its provider")
    void linksExistingAccount() throws Exception {
        User existing = new User("Jane", "jane@example.com", "hash");
        when(tokenVerifier.verify("t")).thenReturn(Optional.of(identity(true)));
        when(userRepository.findByGoogleId("g-1")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(existing));

        GoogleAuthService.Result result = service.authenticate("t");

        assertFalse(result.newUser());
        assertEquals("g-1", existing.getGoogleId());
        assertTrue(existing.isVerified());
        assertEquals(AuthProvider.LOCAL, existing.getAuthProvider());
        assertEquals("hash", existing.getPassword());
    }

    @Test
    @DisplayName("authenticate -> disabled account is blocked")
    void disabledUser() {
        User existing = new User("Jane", "jane@example.com", null);
        existing.setEnabled(false);
        when(tokenVerifier.verify("t")).thenReturn(Optional.of(identity(true)));
        when(userRepository.findByGoogleId("g-1")).thenReturn(Optional.of(existing));

        assertThrows(UserVerificationException.class, () -> service.authenticate("t"));
    }
}
