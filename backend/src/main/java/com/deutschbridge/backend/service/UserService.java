package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.exception.UserVerificationException;
import com.deutschbridge.backend.model.dto.AdminBulkDeleteUsersResult;
import com.deutschbridge.backend.model.dto.AdminBulkDeleteUsersRowResult;
import com.deutschbridge.backend.model.dto.AdminCreateUserRequest;
import com.deutschbridge.backend.model.dto.AdminUpdateUserRequest;
import com.deutschbridge.backend.model.dto.UserDto;
import com.deutschbridge.backend.model.dto.UserRegistrationRequest;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserProfile;
import com.deutschbridge.backend.model.enums.AccountType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.UserProfileRepository;
import com.deutschbridge.backend.repository.UserRepository;
import com.deutschbridge.backend.util.JWTUtil;
import jakarta.transaction.Transactional;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


import java.util.ArrayList;
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

    /** For the admin user management list: soft-deleted accounts are hidden. */
    public List<User> findAllForAdmin() {
        return userRepository.findAllByDeletedFalse();
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email).orElseThrow(
                () -> new UsernameNotFoundException("User not found")
        );
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

    public User findById(String id) throws DataNotFoundException {
        return userRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND));
    }

    @Transactional
    public User save(User user) {
        return userRepository.save(user);
    }

    @Transactional
    public User adminUpdateUser(String id, AdminUpdateUserRequest request) throws DataNotFoundException {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND));
        if (request.displayName() != null) existing.setDisplayName(request.displayName());
        if (request.role() != null) existing.setRole(request.role());
        if (request.verified() != null) existing.setVerified(request.verified());
        return userRepository.save(existing);
    }

    @Transactional
    public User adminChangeAccountType(String id, AccountType accountType) throws DataNotFoundException {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND));
        existing.setAccountType(accountType);
        return userRepository.save(existing);
    }

    /** Admin-created accounts skip email verification - the admin is vouching for the address. */
    @Transactional
    public User adminCreateUser(AdminCreateUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("A user with this email already exists.");
        }

        User user = new User(request.displayName(), request.email(), passwordEncoder.encode(request.password()));
        user.setRole(request.role() != null ? request.role() : "STUDENT");
        user.setVerified(true);

        UserProfile profile = new UserProfile();
        profile.setDisplayName(request.displayName());
        profile.setUser(user);
        user.setProfile(profile);

        userRepository.save(user);
        userProfileRepository.save(profile);
        return user;
    }

    @Transactional
    public User adminSetEnabled(String id, boolean enabled) throws DataNotFoundException {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND));
        existing.setEnabled(enabled);
        return userRepository.save(existing);
    }

    /** Soft delete: hides the account and blocks login, but keeps all of their data intact. */
    @Transactional
    public User adminSoftDelete(String id) throws DataNotFoundException {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND));
        existing.setDeleted(true);
        return userRepository.save(existing);
    }

    /**
     * Best-effort bulk soft delete: each id is handled independently, so one bad id (not found, or
     * the requesting admin's own account) never blocks the rest of the batch.
     */
    public AdminBulkDeleteUsersResult adminBulkSoftDelete(List<String> ids, String requestingAdminId) {
        List<AdminBulkDeleteUsersRowResult> results = new ArrayList<>();
        int successCount = 0;

        for (String id : ids) {
            Optional<User> existing = userRepository.findById(id);
            String email = existing.map(User::getEmail).orElse(null);
            try {
                if (id.equals(requestingAdminId)) {
                    throw new IllegalArgumentException("You can't delete your own account.");
                }
                User user = existing.orElseThrow(() -> new DataNotFoundException(NOT_FOUND));
                user.setDeleted(true);
                userRepository.save(user);
                results.add(new AdminBulkDeleteUsersRowResult(id, email, true, null));
                successCount++;
            } catch (Exception e) {
                results.add(new AdminBulkDeleteUsersRowResult(id, email, false, e.getMessage()));
            }
        }

        return new AdminBulkDeleteUsersResult(ids.size(), successCount, ids.size() - successCount, results);
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
