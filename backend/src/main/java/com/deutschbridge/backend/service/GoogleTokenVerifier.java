package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.UserVerificationException;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Arrays;
import java.util.List;

/**
 * Verifies a Google ID token (from the mobile app's Google sign-in) with Google's tokeninfo endpoint,
 * which checks the signature and expiry. We additionally check the audience against our own client IDs.
 */
@Service
public class GoogleTokenVerifier {

    private static final String TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";

    private final RestTemplate restTemplate = new RestTemplate();
    private final List<String> allowedClientIds;

    public GoogleTokenVerifier(@Value("${google.client-ids:}") String clientIds) {
        this.allowedClientIds = Arrays.stream(clientIds.split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    public record GoogleIdentity(String email, String name, String picture) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record TokenInfo(String aud, String iss, String email, String name, String picture,
                     @JsonProperty("email_verified") String emailVerified) {}

    public GoogleIdentity verify(String idToken) throws UserVerificationException {
        if (allowedClientIds.isEmpty()) {
            throw new UserVerificationException("Google sign-in is not configured.");
        }
        TokenInfo info;
        try {
            info = restTemplate.getForObject(
                    UriComponentsBuilder.fromUriString(TOKENINFO_URL).queryParam("id_token", idToken).build().toUri(),
                    TokenInfo.class);
        } catch (RestClientException e) {
            throw new UserVerificationException("Google sign-in failed. Please try again.");
        }
        if (info == null || info.email() == null || !allowedClientIds.contains(info.aud())
                || info.iss() == null || !info.iss().endsWith("accounts.google.com")
                || !"true".equals(info.emailVerified())) {
            throw new UserVerificationException("Google sign-in failed. Please try again.");
        }
        return new GoogleIdentity(info.email().toLowerCase(), info.name(), info.picture());
    }
}
