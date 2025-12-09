package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserService implements UserDetailsService {

    @Autowired
    UserRepository  userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username)
                .orElseThrow(()-> new UsernameNotFoundException("Username not found"));
    }
    public int getTokenValue(String username) {
        return userRepository.findByUsername(username)
                .map(User::getTokenValue)
                .orElse(-1);
    }

    public void incrementTokenValue(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            int newValue = user.getTokenValue() + 1;
            user.setTokenValue(newValue);
            userRepository.save(user);
        });
    }
}
