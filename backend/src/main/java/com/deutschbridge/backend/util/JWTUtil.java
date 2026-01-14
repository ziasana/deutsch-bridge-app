package com.deutschbridge.backend.util;

import com.deutschbridge.backend.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JWTUtil {

    private final UserRepository userRepository;

    private static final String ACCESS_TOKEN_NAME= "ACCESS_TOKEN";
    private final Key key;
    @Value("${jwt.expiration.access-token}")
    private long expirationTimeAccessToken;

    @Value("${jwt.expiration.refresh-token}")
    private long expirationTimeRefreshToken;

    @Value("${jwt.expiration.verification-token}")
    private long expirationTimeVerificationToken;

    // Original constructor for Spring
    @Autowired
    public JWTUtil(UserRepository userRepository, @Value("${jwt.secret}") String jwtSecret){
        this.userRepository = userRepository;
        this.key= Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    // Test constructor
    JWTUtil(UserRepository userRepository, String jwtSecret,
                   long expirationAccess, long expirationRefresh, long expirationVerification) {
        this.userRepository = userRepository;
        this.key= Keys.hmacShaKeyFor(jwtSecret.getBytes());
        this.expirationTimeAccessToken = expirationAccess;
        this.expirationTimeRefreshToken = expirationRefresh;
        this.expirationTimeVerificationToken = expirationVerification;
    }


    public String generateAccessToken(String email) {
        return buildToken(email, expirationTimeAccessToken, ACCESS_TOKEN_NAME);
    }

    public String generateRefreshToken(String email) {
        return buildToken(email, expirationTimeRefreshToken, "");
    }

    public String generateVerificationToken(String email) {
        return buildToken(email, expirationTimeVerificationToken, "");
    }

    private String buildToken(String email, long expirationTime, String type) {
        JwtBuilder builder = Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationTime));

        if (type.equals(ACCESS_TOKEN_NAME)) {
            builder.claim("type", ACCESS_TOKEN_NAME);
            builder.claim("tokenVersion", userRepository.incrementAndGetAccessTokenFlag(email));
        }

        return builder
                .signWith(SignatureAlgorithm.HS256, key)
                .compact();
    }


    public String extractEmail(String token) {
       return extractClaims(token).getSubject();
    }

    Claims extractClaims(String token) {
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
                && isValidateTokenFlag(email,token)
                && isTokenExpired(token);
    }

    public boolean isValidateTokenFlag(String email, String token) {
        Claims claims = extractClaims(token);
        String type= claims.get("type").toString();
        if(type==null)
            return true;
        if(type.equals(ACCESS_TOKEN_NAME)) {
         return   claims.get("tokenVersion").equals(userRepository.getAccessTokenFlag(email));
        }
        return  false;
    }

    private boolean isTokenExpired(String token) {
        return !extractClaims(token).getExpiration().before(new Date());
    }
}
