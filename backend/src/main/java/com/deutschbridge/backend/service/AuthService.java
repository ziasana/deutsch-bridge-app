package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;

    public AuthService(AuthenticationManager authenticationManager) {
        this.authenticationManager = authenticationManager;
    }

    public void login(String email, String password) throws DataNotFoundException {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );
        } catch (DisabledException | LockedException e) {
            throw new DataNotFoundException("Your account isn't active yet. Please verify your email first.");
        } catch (AuthenticationException e) {
            // Same message for unknown email and wrong password so we don't reveal which accounts exist.
            throw new DataNotFoundException("Incorrect email or password.");
        } catch (Exception e) {
            throw new DataNotFoundException("Login failed. Please try again.");
        }
    }
}
