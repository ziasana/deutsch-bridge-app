package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.UserDto;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.UserRole;
import com.deutschbridge.backend.repository.UserRepository;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final JWTUtil jwtUtil;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       EmailService emailService,
                       JWTUtil jwtUtil
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.jwtUtil = jwtUtil;
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email).orElseThrow(
                () -> new UsernameNotFoundException("User not found with email: " + email)
        );
      
    public int getTokenValue(String username) {
        return userRepository.getTokenValue(username);
    }

    @Transactional
    public  int incrementAndGetTokenValue(String username) {
        userRepository.incrementTokenValue(username);
        return userRepository.getTokenValue(username);
    }

    public User registerUser(UserDto userDto)
    {
        // check username uniqueness
        if (userRepository.findByUsername(userDto.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        // check email uniqueness
        if (userRepository.existsByEmail(userDto.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        Optional<User> existingUser= userRepository.findByEmail(userDto.getEmail());
        if(existingUser.isPresent())
        {
            if(existingUser.get().isVerified())
            {
                throw new RuntimeException("User is already verified");
            }else{
                String verificationToken = jwtUtil.generateToken(userDto.getEmail());
                existingUser.get().setVerificationToken(verificationToken);
                userRepository.save(existingUser.get());
                //send verification email
                emailService.sendVerificationEmail(userDto.getEmail(), verificationToken);
            }
            return existingUser.get();
        }

        User user = new User(
                userDto.getUsername(),
                userDto.getEmail(),
                passwordEncoder.encode(userDto.getPassword()),
                UserRole.STUDENT.getValue()
        );
        user.setVerificationToken(jwtUtil.generateToken(userDto.getEmail()));
        //send email verification
        emailService.sendVerificationEmail(userDto.getEmail(), user.getVerificationToken());
        return userRepository.save(user);
    }
}
