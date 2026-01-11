package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.AuthUser;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository  userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user= userRepository.findByEmail(email)
                .orElseThrow(()-> new UsernameNotFoundException("Username not found!"));
        AuthUser authUser = new AuthUser(
                new User(user.getDisplayName(), user.getEmail(), user.getPassword())
        );
        authUser.setId(user.getId());
        return authUser;
    }
}
