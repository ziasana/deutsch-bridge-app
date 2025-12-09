package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.UserVerificationException;
import com.deutschbridge.backend.model.dto.UserDto;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.UserRole;
import com.deutschbridge.backend.repository.UserRepository;
import com.deutschbridge.backend.util.JWTUtil;
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
    }

    public User registerUser(UserDto userDto) throws UserVerificationException {
        // check username uniqueness
        if (userRepository.findByUsername(userDto.getUsername()).isPresent()) {
            throw new UserVerificationException("Username already exists");
        }
        // check email uniqueness
        if (userRepository.existsByEmail(userDto.getEmail())) {
            throw new UserVerificationException("Email already registered");
        }
        Optional<User> existingUser= userRepository.findByEmail(userDto.getEmail());
        if(existingUser.isPresent())
        {
            if(existingUser.get().isVerified())
            {
                throw new UserVerificationException("User is already verified");
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


    public boolean resetPassword(String email) throws UserVerificationException {
        // check if user exist
        if (!userRepository.existsByEmail(email)) {
            throw new UserVerificationException("This user is not registered yet!");
        }
        Optional<User> existingUser= userRepository.findByEmail(email);
        if(existingUser.isPresent())
        {
            if(!existingUser.get().isVerified())
            {
                throw new UserVerificationException("User is not verified");
            }else
            {
                String resetToken = jwtUtil.generateToken(email);
                existingUser.get().setResetToken(resetToken);
                userRepository.save(existingUser.get());
                //send rest link email
                emailService.sendForgotPasswordEmail(email, resetToken);
                return true;
            }
        }
        return false;
    }

}
