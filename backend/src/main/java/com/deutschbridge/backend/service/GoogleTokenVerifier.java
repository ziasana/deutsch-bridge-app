package com.deutschbridge.backend.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Optional;

/** Checks a Google ID token's signature, audience (our client id), issuer and expiry. */
@Component
public class GoogleTokenVerifier {

    /** The verified facts we trust from Google. */
    public record GoogleIdentity(String googleId, String email, boolean emailVerified, String name, String pictureUrl) {
    }

    private static final Logger log = LoggerFactory.getLogger(GoogleTokenVerifier.class);

    private final GoogleIdTokenVerifier verifier;
    private final boolean configured;

    public GoogleTokenVerifier(@Value("${google.client-id:}") String clientId) {
        this.configured = clientId != null && !clientId.isBlank();
        this.verifier = configured
                ? new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                        .setAudience(Collections.singletonList(clientId))
                        .build()
                : null;
    }

    public Optional<GoogleIdentity> verify(String idToken) {
        if (!configured) {
            log.warn("Google sign-in is not configured: set GOOGLE_CLIENT_ID");
            return Optional.empty();
        }
        try {
            GoogleIdToken token = verifier.verify(idToken);
            if (token == null) {
                log.warn("Google ID token rejected (bad signature, audience, issuer or expired)");
                return Optional.empty();
            }
            GoogleIdToken.Payload p = token.getPayload();
            return Optional.of(new GoogleIdentity(
                    p.getSubject(),
                    p.getEmail(),
                    Boolean.TRUE.equals(p.getEmailVerified()),
                    (String) p.get("name"),
                    (String) p.get("picture")));
        } catch (Exception e) {
            log.warn("Google ID token verification failed", e);
            return Optional.empty();
        }
    }
}
