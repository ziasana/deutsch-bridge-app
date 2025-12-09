package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;


@Component
public class AdminUserInitializer {

    private final Logger log;
    public AdminUserInitializer(Logger log) {
        this.log = log;
    }

    @Bean
    public CommandLineRunner createAdminUser(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if(userRepository.findByUsername("admin").isEmpty()) {
                User user = new User();
                user.setUsername("admin");
                user.setPassword(passwordEncoder.encode("admin12345"));
                user.setRole("ADMIN");
                user.setEmail("admin@gmail.com");
                userRepository.save(user);
                log.info("Default user admin created!");
            }
        };
    }
}
