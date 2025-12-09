package com.deutschbridge.backend.util;

import com.deutschbridge.backend.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import java.util.Date;

@Component
public class JWTUtil {

    private final UserRepository userRepository;
    @Value("${jwt.secret}")
    public String jwtSecret= "";
    private static final long EXPIRATION_TIME = (1000*60*60); //1 hour

    public JWTUtil(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public String generateToken(String username) {
         return  Jwts.builder()
                .setSubject(username)
                .setAudience(String.valueOf(userRepository.incrementTokenValue(username)))
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(SignatureAlgorithm.HS256, jwtSecret)
                .compact();
    }

    public String extractUsernameOrEmail(String token) {
       return extractClaims(token).getSubject();
    }

    private Claims extractClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(jwtSecret)
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
                && isValidateTokenValue(username,token)
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
