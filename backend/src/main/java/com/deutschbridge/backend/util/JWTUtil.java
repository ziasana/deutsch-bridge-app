package com.deutschbridge.backend.util;

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
    private static final long EXPIRATION_TIME_ACCESS_TOKEN = (1000 * 60 * 15); //15 min
    private static final long EXPIRATION_TIME_REFRESH_TOKEN = (1000 * 60 * 60 * 24 *15); //10 days

    public JWTUtil(UserRepository userRepository, @Value("${jwt.secret}") String jwtSecret){
        this.userRepository = userRepository;
        this.key= Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }
    public String generateRefreshToken(String username) {
        return generateToken(username, EXPIRATION_TIME_REFRESH_TOKEN);
    }
    public String generateAccessToken(String username) {
        return generateToken(username, EXPIRATION_TIME_ACCESS_TOKEN);
    }

    private String generateToken(String username, long expirationTime) {
        return Jwts.builder()
                .setSubject(username)
                .setAudience(String.valueOf(userRepository.incrementTokenValue(username)))
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(SignatureAlgorithm.HS256, key)
                .compact();
    }

    public String extractUsernameOrEmail(String token) {
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

    public boolean validateToken(String username, UserDetails userDetails, String token) {
        //check if username is same as username in userDetails
        //check if token is not expired
        return username.equals(userDetails.getUsername())
               // && isValidateTokenValue(username,token)
                && isTokenExpired(token);
    }

    public boolean isValidateTokenValue(String username, String token) {
        return extractClaims(token)
                .getAudience()
                .equals(String.valueOf(userRepository.getTokenValue(username)));
    }

    private boolean isTokenExpired(String token) {
        return !extractClaims(token).getExpiration().before(new Date());
    }
}
