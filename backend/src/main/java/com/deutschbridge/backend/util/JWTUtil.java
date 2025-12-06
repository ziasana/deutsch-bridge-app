package com.deutschbridge.backend.util;

import com.deutschbridge.backend.config.EnvConfig;
import io.github.cdimascio.dotenv.Dotenv;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.util.Date;

@Component
public class JWTUtil {

    private final String JWT_SECRET;
    final long EXPIRATION_TIME = 1000*60*60; //1 hour

    public JWTUtil(EnvConfig envConfig) {
        this.JWT_SECRET = envConfig.getJwtSecretKey();
    }

    public String generateToken(String username) {
      return  Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(SignatureAlgorithm.HS256, JWT_SECRET)
                .compact();
    }

}
