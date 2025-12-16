package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Optional;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository= mock(UserRepository.class);
    @InjectMocks
    private CustomUserDetailsService customUserDetailsService;

    @Test
    @DisplayName("loadUser should return user")
    void loadUserByUsername_ShouldReturnUser() {
        String username = "username";
        User user= new User();
        user.setUsername(username);
        user.setPassword("password");
        user.setEmail("email");
        userRepository.save(user);
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        UserDetails result = customUserDetailsService.loadUserByUsername(username);
        assertNotNull(result);
        assertThat(result.getUsername()).isEqualTo(username);
        verify(userRepository, times(1)).findByUsername(username);
    }
}