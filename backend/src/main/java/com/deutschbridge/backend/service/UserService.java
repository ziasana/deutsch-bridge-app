package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.exception.UserVerificationException;
import com.deutschbridge.backend.model.dto.UserDto;
import com.deutschbridge.backend.model.dto.UserRegistrationDto;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserProfile;
import com.deutschbridge.backend.model.enums.UserRole;
import com.deutschbridge.backend.repository.UserProfileRepository;
import com.deutschbridge.backend.repository.UserRepository;
import com.deutschbridge.backend.util.JWTUtil;
import jakarta.transaction.Transactional;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final JWTUtil jwtUtil;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserProfileRepository userProfileRepository;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       EmailService emailService,
                       JWTUtil jwtUtil,
                       UserProfileRepository userProfileRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.jwtUtil = jwtUtil;
        this.userProfileRepository = userProfileRepository;
    }

    public List<User> findAll()
    {
        return userRepository.findAll();
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email).orElseThrow(
                () -> new UsernameNotFoundException("User not found with email: " + email)
        );
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username).orElseThrow(
                () -> new UsernameNotFoundException("User not found with username: " + username)
        );
    }

    public User registerUser(UserRegistrationDto userRegistrationDto) throws UserVerificationException {

        // check username uniqueness
        if (userRepository.findByUsername(userRegistrationDto.username()).isPresent()) {
            throw new UserVerificationException("Username already exists");
        }
        // check email uniqueness
        if (userRepository.existsByEmail(userRegistrationDto.email())) {
            throw new UserVerificationException("Email already registered!");
        }
        Optional<User> existingUser= userRepository.findByEmail(userRegistrationDto.email());
        if(existingUser.isPresent())
        {
            if(existingUser.get().isVerified())
            {
                throw new UserVerificationException("User is already verified!");
            }else{
                String verificationToken = jwtUtil.generateVerificationToken(userRegistrationDto.email());
                existingUser.get().setVerificationToken(verificationToken);
                userRepository.save(existingUser.get());
                //send verification email
                emailService.sendVerificationEmail(userRegistrationDto.email(), verificationToken);
            }
            return existingUser.get();
        }

        User user = new User(
                userRegistrationDto.username(),
                userRegistrationDto.email(),
                passwordEncoder.encode(userRegistrationDto.password()),
                UserRole.STUDENT.getValue()
        );
        user.setVerificationToken(jwtUtil.generateVerificationToken(userRegistrationDto.email()));
        UserProfile userProfile = new UserProfile();
        userProfile.setUser(user);
        userProfile.setDisplayName(userRegistrationDto.displayName());
        user.setProfile(userProfile);
        //send email verification
        emailService.sendVerificationEmail(userRegistrationDto.email(), user.getVerificationToken());
        userRepository.save(user);
        userProfileRepository.save(userProfile);
        return user;

    }


    public boolean forgotPassword(String email) throws UserVerificationException, DataNotFoundException {
        // Try to get the user directly
        User existingUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new DataNotFoundException("User not registered yet!"));

        // Check if user is verified
        if (!existingUser.isVerified()) {
            throw new UserVerificationException("User is not verified!");
        }

        String resetToken = jwtUtil.generateVerificationToken(email);
        existingUser.setResetToken(resetToken);
        userRepository.save(existingUser);
        //send rest link email
        emailService.sendForgotPasswordEmail(email, resetToken);
        return true;

    }

    @Transactional
    public User resetPassword(String password, String token) throws DataNotFoundException, UserVerificationException {
        if(!jwtUtil.validateToken(token))
        {
            throw new UserVerificationException("Invalid Token!");
        }

        String username = jwtUtil.extractUsernameOrEmail(token);
        User existing = userRepository.findByEmail(username)
                .orElseThrow(() -> new DataNotFoundException("User not found!"));

        if (password != null)
        {
            existing.setPassword( passwordEncoder.encode(password));
            existing.setResetToken(null);
        }
        return userRepository.save(existing);
    }

    @Transactional
    public void updatePassword(UserDto userDto) throws DataNotFoundException {
        User existing = userRepository.findByUsername(userDto.getUsername())
                .orElseThrow(() -> new DataNotFoundException("User not found!"));
        if (userDto.getPassword() != null) existing.setPassword( passwordEncoder.encode(userDto.getPassword()));
        userRepository.save(existing);
    }

    @Transactional
    public User update(UserDto userDto) throws DataNotFoundException {
        User existing = userRepository.findByEmail(userDto.getEmail())
                .orElseThrow(() -> new DataNotFoundException("User not found!"));
        if (userDto.getPassword() != null) existing.setPassword( passwordEncoder.encode(userDto.getPassword()));
        return userRepository.save(existing);
    }

    @Transactional
    public boolean deleteByEmail(UserDto  userDto) throws DataNotFoundException {
        userRepository.findByEmail(userDto.getEmail())
                .orElseThrow( ()-> new DataNotFoundException("User not found!"));
        userRepository.deleteByEmail(userDto.getEmail());
        return true;
    }

    public void saveRefreshToken(String username, String refreshToken){
        userRepository.saveRefreshToken(username, refreshToken);
    }

    public String getRefreshToken(String username){
      User user=  userRepository.findByUsername(username).orElseThrow(()-> new UsernameNotFoundException("User not found!"));
      if(user.getRefreshToken() != null){
          return user.getRefreshToken();
      }
      return null;
    }
}
