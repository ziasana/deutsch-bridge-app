package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.junit.jupiter.api.Assertions.*;

/** Logging in must not depend on the casing of the email the user types. */
@Testcontainers
@SpringBootTest(properties = "notifications.scheduler.enabled=false")
@ActiveProfiles("test")
@Transactional
class LoginEmailCaseIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private AuthService authService;
    @Autowired private PasswordEncoder passwordEncoder;

    private void saveUser(String email) {
        User user = new User("Case Tester", email, passwordEncoder.encode("secret123"));
        user.setVerified(true);
        user.setEnabled(true);
        userRepository.saveAndFlush(user);
    }

    @Test
    @DisplayName("login -> succeeds with any casing of the email, for lower and mixed case stored emails")
    void loginIgnoresEmailCase() throws Exception {
        saveUser("lower.case@example.com");
        saveUser("Mixed.Case@Example.com");

        assertDoesNotThrow(() -> authService.login("LOWER.CASE@EXAMPLE.COM", "secret123"));
        assertDoesNotThrow(() -> authService.login("mixed.case@example.com", "secret123"));
        assertDoesNotThrow(() -> authService.login("MIXED.CASE@EXAMPLE.COM", "secret123"));
        assertTrue(userRepository.existsByEmail("MIXED.case@example.com"));
        assertEquals("Mixed.Case@Example.com", userRepository.findByEmail("mixed.case@example.com").orElseThrow().getEmail());
    }
}
