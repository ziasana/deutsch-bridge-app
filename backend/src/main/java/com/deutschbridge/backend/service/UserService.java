package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.exception.UserVerificationException;
import com.deutschbridge.backend.model.dto.UserDto;
import com.deutschbridge.backend.model.dto.UserRegistrationRequest;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserProfile;
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

    static final String notFound= "User not found!";

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

    public User registerUser(UserRegistrationRequest request) throws UserVerificationException {

        // check email uniqueness
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new UserVerificationException("Email already registered!");
        }

        Optional<User> existingUser= userRepository.findByEmail(request.getEmail());
        if(existingUser.isPresent())
        {
            if(existingUser.get().isVerified())
            {
                throw new UserVerificationException("User is already verified!");
            }else{
                String verificationToken = jwtUtil.generateVerificationToken(request.getEmail());
                existingUser.get().setVerificationToken(verificationToken);
                userRepository.save(existingUser.get());
                //send verification email
                emailService.sendVerificationEmail(request.getEmail(), verificationToken);
            }
            return existingUser.get();
        }

        User user = new User(
                request.getDisplayName(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword())
        );
        user.setVerificationToken(jwtUtil.generateVerificationToken(request.getEmail()));
        UserProfile userProfile = new UserProfile();
        userProfile.setUser(user);
        userProfile.setDisplayName(request.getDisplayName());
        user.setProfile(userProfile);
        //send email verification
        emailService.sendVerificationEmail(request.getEmail(), user.getVerificationToken());
        userRepository.save(user);
        userProfileRepository.save(userProfile);
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
                .orElseThrow(() -> new DataNotFoundException(notFound));
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
    public void updatePassword(String id, String password) throws DataNotFoundException {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException(notFound));
        if (password != null) existing.setPassword(passwordEncoder.encode(password));
        userRepository.save(existing);
    }

    @Transactional
    public User update(UserDto userDto) throws DataNotFoundException {
        User existing = userRepository.findByEmail(userDto.getEmail())
                .orElseThrow(() -> new DataNotFoundException(notFound));
        if (userDto.getPassword() != null) existing.setPassword( passwordEncoder.encode(userDto.getPassword()));
        return userRepository.save(existing);
    }

    @Transactional
    public boolean deleteByEmail(UserDto  userDto) throws DataNotFoundException {
        userRepository.findByEmail(userDto.getEmail())
                .orElseThrow( ()-> new DataNotFoundException(notFound));
        userRepository.deleteByEmail(userDto.getEmail());
        return true;
    }

    public void saveRefreshToken(String email, String refreshToken){
        userRepository.saveRefreshToken(email, refreshToken);
    }
}
