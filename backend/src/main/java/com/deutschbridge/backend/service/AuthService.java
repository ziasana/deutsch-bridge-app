package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.AuthUser;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;

    public AuthService(AuthenticationManager authenticationManager) {
        this.authenticationManager = authenticationManager;
    }

    /** Checks the credentials and returns the email as stored on the account (whatever casing was typed). */
    public String login(String email, String password) throws DataNotFoundException {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );
            return authentication.getPrincipal() instanceof AuthUser authUser ? authUser.getEmail() : email;
        } catch (DisabledException | LockedException e) {
            throw new DataNotFoundException("Your account isn't active yet. Please verify your email first.");
        } catch (AuthenticationException e) {
            org.slf4j.LoggerFactory.getLogger(AuthService.class)
                    .warn("Login rejected: {}", e.getClass().getSimpleName(), e.getCause());
            // Same message for unknown email and wrong password so we don't reveal which accounts exist.
            throw new DataNotFoundException("Incorrect email or password.");
        } catch (Exception e) {
            throw new DataNotFoundException("Login failed. Please try again.");
        }
    }
}
