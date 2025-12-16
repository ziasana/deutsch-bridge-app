package com.deutschbridge.backend.util;

import com.deutschbridge.backend.model.AuthUser;
import com.deutschbridge.backend.model.entity.CustomUserDetails;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JWTUtil {

    private final UserRepository userRepository;

    private final Key key;
    private static final long EXPIRATION_TIME_ACCESS_TOKEN = (1000 * 60 * 15 ); //15 min
    private static final long EXPIRATION_TIME_REFRESH_TOKEN = (1000 * 60 * 60 * 24 *15); //10 days
    private static final long EXPIRATION_TIME_VERIFICATION_TOKEN = (1000 * 60 * 60 * 24 ); //10 days

    public JWTUtil(UserRepository userRepository, @Value("${jwt.secret}") String jwtSecret){
        this.userRepository = userRepository;
        this.key= Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }
    public String generateVerificationToken(String email) {
        return generateToken(email, EXPIRATION_TIME_VERIFICATION_TOKEN);
    }

    public String generateRefreshToken(String email) {
        return generateToken(email, EXPIRATION_TIME_REFRESH_TOKEN);
    }

    public String generateAccessToken(String email) {
        return generateToken(email, EXPIRATION_TIME_ACCESS_TOKEN);
    }

    private String generateToken(String email, long expirationTime) {
        return Jwts.builder()
                .setSubject(email)
                .setAudience(String.valueOf(userRepository.incrementTokenValue(email)))
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(SignatureAlgorithm.HS256, key)
                .compact();
    }

    public String extractEmail(String token) {
       return extractClaims(token).getSubject();
    }

    private Claims extractClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public boolean validateToken(String token) {
        return isTokenExpired(token);
    }

    public boolean validateToken(String email, UserDetails userDetails, String token) {
        //check if username is same as username in userDetails
        //check if token is not expired
        return email.equals(userDetails.getUsername())
               // && isValidateTokenValue(username,token)
                && isTokenExpired(token);
    }

    public boolean isValidateTokenValue(String email, String token) {
        return extractClaims(token)
                .getAudience()
                .equals(String.valueOf(userRepository.getTokenValue(email)));
    }

    private boolean isTokenExpired(String token) {
        return !extractClaims(token).getExpiration().before(new Date());
    }
}
