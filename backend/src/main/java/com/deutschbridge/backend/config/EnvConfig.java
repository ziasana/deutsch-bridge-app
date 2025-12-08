package com.deutschbridge.backend.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.stereotype.Component;

@Component
public class EnvConfig {

    private final Dotenv dotenv;

    public EnvConfig() {
        this.dotenv = Dotenv
                //.configure()
               // .directory("./backend")
              //  .filename(".env")
                .load();
    }
    public String getJwtSecretKey() {
        return dotenv.get("JWT_SECRET_KEY");
    }
}
