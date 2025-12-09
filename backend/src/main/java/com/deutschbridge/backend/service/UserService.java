package com.deutschbridge.backend.service;

import com.deutschbridge.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserService implements UserDetailsService {

    @Autowired
    private  UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username)
                .orElseThrow(()-> new UsernameNotFoundException("Username not found"));
    }

    public int getTokenValue(String username) {
        return userRepository.getTokenValue(username);
    }

    @Transactional
    public  int incrementAndGetTokenValue(String username) {
        userRepository.incrementTokenValue(username);
        return userRepository.getTokenValue(username);
    }


}
