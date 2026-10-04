package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.UserVerificationException;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserProfile;
import com.deutschbridge.backend.model.enums.AuthProvider;
import com.deutschbridge.backend.repository.UserProfileRepository;
import com.deutschbridge.backend.repository.UserRepository;
import com.deutschbridge.backend.service.GoogleTokenVerifier.GoogleIdentity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/** Signs a learner in (or up) with a Google ID token. */
@Service
public class GoogleAuthService {

    /** The resolved account and whether this call created it. */
    public record Result(User user, boolean newUser) {
    }

    private final GoogleTokenVerifier tokenVerifier;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    public GoogleAuthService(GoogleTokenVerifier tokenVerifier,
                             UserRepository userRepository,
                             UserProfileRepository userProfileRepository) {
        this.tokenVerifier = tokenVerifier;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional
    public Result authenticate(String idToken) throws UserVerificationException {
        GoogleIdentity identity = tokenVerifier.verify(idToken)
                .orElseThrow(() -> new UserVerificationException("Google sign-in failed. Please try again."));
        if (!identity.emailVerified() || identity.email() == null) {
            throw new UserVerificationException("Your Google email address is not verified.");
        }

        String email = identity.email().toLowerCase();
        Optional<User> byGoogleId = userRepository.findByGoogleId(identity.googleId());
        Optional<User> existing = byGoogleId.isPresent() ? byGoogleId : userRepository.findByEmail(email);

        if (existing.isPresent()) {
            User user = existing.get();
            if (!user.isEnabled() || user.isDeleted()) {
                throw new UserVerificationException("Your account isn't active. Please contact support.");
            }
            // Link an existing email/password account: Google has verified the address, so it is the same person.
            // The account keeps its provider and password, so both ways of signing in keep working.
            boolean changed = false;
            if (user.getGoogleId() == null) {
                user.setGoogleId(identity.googleId());
                changed = true;
            }
            if (!user.isVerified()) {
                user.setVerified(true);
                user.setVerificationToken(null);
                changed = true;
            }
            if (changed) {
                userRepository.save(user);
            }
            return new Result(user, false);
        }

        String displayName = identity.name() != null && !identity.name().isBlank()
                ? identity.name()
                : email.substring(0, email.indexOf('@'));
        User user = new User();
        user.setEmail(email);
        user.setDisplayName(displayName);
        user.setAvatarUrl(identity.pictureUrl());
        user.setPassword(null);
        user.setAuthProvider(AuthProvider.GOOGLE);
        user.setGoogleId(identity.googleId());
        user.setVerified(true);

        UserProfile profile = new UserProfile();
        profile.setDisplayName(displayName);
        profile.setUser(user);
        user.setProfile(profile);

        userRepository.save(user);
        userProfileRepository.save(profile);
        return new Result(user, true);
    }
}
