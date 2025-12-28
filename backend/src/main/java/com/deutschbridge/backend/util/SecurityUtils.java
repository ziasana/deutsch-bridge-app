package com.deutschbridge.backend.util;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.AuthUser;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {
    private SecurityUtils() {
        throw new IllegalStateException("Security Utils class");
    }
    /**
     * Returns the currently authenticated AuthUser
     */
    public static AuthUser getCurrentUser() throws DataNotFoundException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthUser) {
            return (AuthUser) auth.getPrincipal();
        }
        throw new DataNotFoundException("No authenticated user found");
    }

    /**
     * Returns the email of the currently authenticated user
     */
    public static String getAuthenticatedEmail() throws DataNotFoundException {
        return getCurrentUser().getEmail();
    }
}
