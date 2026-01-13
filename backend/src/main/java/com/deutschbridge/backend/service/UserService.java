package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.exception.UserVerificationException;
import com.deutschbridge.backend.model.dto.UserDto;
import com.deutschbridge.backend.model.dto.UserRegistrationRequest;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserProfile;
import com.deutschbridge.backend.model.enums.LearningLevel;
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

    static final String NOT_FOUND= "User not found!";

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
                () -> new UsernameNotFoundException("User not found")
        );
    }

    public void existsByEmail(String email) {
        if(!userRepository.existsByEmail(email))
            throw new UsernameNotFoundException("User not found");
    }

    public User registerUser(UserRegistrationRequest request) throws UserVerificationException {

        Optional<User> existingUserOpt =
                userRepository.findByEmail(request.getEmail());

        // Case 1 & 2: user exists
        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();

            // Case 1: already verified → exception
            if (existingUser.isVerified()) {
                throw new UserVerificationException("Email already registered");
            }

            // Case 2: exists but not verified → resend verification
            String verificationToken =
                    jwtUtil.generateVerificationToken(existingUser.getEmail());

            existingUser.setVerificationToken(verificationToken);
            userRepository.save(existingUser);

            emailService.sendVerificationEmail(
                    existingUser.getEmail(),
                    verificationToken
            );

            return existingUser;
        }

        // Case 3: new user
        User user = new User(
                request.getDisplayName(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword())
        );

        String verificationToken =
                jwtUtil.generateVerificationToken(user.getEmail());
        user.setVerificationToken(verificationToken);

        UserProfile profile = new UserProfile();
        profile.setDisplayName(request.getDisplayName());
        profile.setUser(user);
        user.setProfile(profile);

        userRepository.save(user);
        userProfileRepository.save(profile);

        emailService.sendVerificationEmail(
                user.getEmail(),
                verificationToken
        );

        return user;
    }


    public boolean sendResetLink(String email) throws UserVerificationException, DataNotFoundException {
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

        String email = jwtUtil.extractEmail(token);
        User existing = userRepository.findByEmail(email)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND));
        if(existing.getResetToken()==null)
        {
            throw new UserVerificationException("Invalid Token!");
        }
        if (password != null)
        {
            existing.setPassword( passwordEncoder.encode(password));
            existing.setResetToken(null);
        }
        return userRepository.save(existing);
    }

    @Transactional
    public boolean updatePassword(String id, String password) throws DataNotFoundException {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND));
        // nothing to update
        if (password == null || password.isBlank()) {
            return false;
        }
        existing.setPassword(passwordEncoder.encode(password));
        userRepository.save(existing);

        return true;
    }

    @Transactional
    public User update(UserDto userDto) throws DataNotFoundException {
        User existing = userRepository.findByEmail(userDto.getEmail())
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND));
        if (userDto.getPassword() != null) existing.setPassword( passwordEncoder.encode(userDto.getPassword()));
        return userRepository.save(existing);
    }

    @Transactional
    public boolean deleteByEmail(UserDto  userDto) throws DataNotFoundException {
        userRepository.findByEmail(userDto.getEmail())
                .orElseThrow( ()-> new DataNotFoundException(NOT_FOUND));
        userRepository.deleteByEmail(userDto.getEmail());
        return true;
    }

    public String getLearningLevel(String email) {
        return userRepository.findByEmail(email)
                .map(User::getProfile)
                .map(UserProfile::getLearningLevel)
                .map(LearningLevel::getValue)
                .orElse("A1");
    }

    public void saveRefreshToken(String email, String refreshToken){
        userRepository.saveRefreshToken(email, refreshToken);
    }
}
