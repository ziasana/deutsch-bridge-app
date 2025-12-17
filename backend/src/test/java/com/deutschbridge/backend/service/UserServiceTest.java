package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.exception.UserVerificationException;
import com.deutschbridge.backend.model.dto.UserDto;
import com.deutschbridge.backend.model.dto.UserRegistrationRequest;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.repository.UserProfileRepository;
import com.deutschbridge.backend.util.JWTUtil;
import com.deutschbridge.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.assertj.core.api.AssertionsForClassTypes.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.*;

class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private UserProfileRepository userProfileRepository;

    @Mock JWTUtil jwtUtil;
    @Mock private EmailService emailService;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User user;
    private UserRegistrationRequest userRegistrationRequest;

    private UserDto userDto;

    @BeforeEach
    void setup() {

        MockitoAnnotations.openMocks(this);
        user = new User("john", "john@example.com", "pass");
        user.setVerified(true);

        userRegistrationRequest = new UserRegistrationRequest();
        userRegistrationRequest.setEmail("john@example.com");
        userRegistrationRequest.setPassword("secret");
        userRegistrationRequest.setDisplayName("John");

        userDto = new UserDto();
        userDto.setUsername("john");
        userDto.setEmail("john@example.com");
        userDto.setPassword("secret");
    }

    // ---------------------------------------------------------------
    // findAll
    // ---------------------------------------------------------------
    @Test
    @DisplayName("findAll should return list of users")
    void testFindAll_ShouldReturnListOfUsers() {
        when(userRepository.findAll()).thenReturn(List.of(user));
        List<User> result = userService.findAll();

        assertNotNull(result);
        assertEquals(List.of(user), result);
        verify(userRepository, times(1)).findAll();
    }

    // ---------------------------------------------------------------
    // findByEmail
    // ---------------------------------------------------------------
    @Test
    @DisplayName("findByEmail should return user")
    void testFindByEmail() {
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));

        User result = userService.findByEmail("john@example.com");

        assertThat(result.getEmail()).isEqualTo("john@example.com");
    }

    @Test
    @DisplayName("findByEmail should throw exception if not found")
    void testFindByEmail_NotFound() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.findByEmail("unknown@example.com"))
                .isInstanceOf(UsernameNotFoundException.class);
    }


    // ---------------------------------------------------------------
    // registerUser
    // ---------------------------------------------------------------

    @Test
    @DisplayName("registerUser should throw when email is already registered")
    void registerUser_verifiedUser_shouldThrow() {
        User user = new User();
        user.setVerified(true);

        when(userRepository.findByEmail("john@example.com"))
                .thenReturn(Optional.of(user));

        assertThatThrownBy(() ->
                userService.registerUser(userRegistrationRequest))
                .isInstanceOf(UserVerificationException.class)
                .hasMessageContaining("Email already registered");

        verify(emailService, never()).sendVerificationEmail(any(), any());
    }


    @Test
    @DisplayName("registerUser should update existing unverified user and send email")
    void registerUser_unverifiedUser_shouldResendVerification() throws UserVerificationException {
        User user = new User();
        user.setEmail("john@example.com");
        user.setVerified(false);

        when(userRepository.findByEmail("john@example.com"))
                .thenReturn(Optional.of(user));
        when(jwtUtil.generateVerificationToken(any()))
                .thenReturn("token");

        User result = userService.registerUser(userRegistrationRequest);

        assertThat(result).isSameAs(user);
        verify(userRepository).save(user);
        verify(emailService).sendVerificationEmail(
                eq("john@example.com"), eq("token"));
    }

    @Test
    @DisplayName("registerUser should create new user when no conflicts")
    void registerUser_newUser_shouldRegister() throws UserVerificationException {
        when(userRepository.findByEmail("john@example.com"))
                .thenReturn(Optional.empty());
        when(jwtUtil.generateVerificationToken(any()))
                .thenReturn("token");

        User result = userService.registerUser(userRegistrationRequest);

        assertThat(result.getEmail()).isEqualTo("john@example.com");
        verify(userRepository).save(any(User.class));
        verify(emailService).sendVerificationEmail(
                eq("john@example.com"), eq("token"));
    }


    // ---------------------------------------------------------------
    // resetPassword
    // ---------------------------------------------------------------
    @Test
    @DisplayName("sendResetLink should throw when user doesn't exist")
    void testSendResetLink_UserNotFound() {
        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);

        assertThatThrownBy(() -> userService.sendResetLink("john@example.com"))
                .isInstanceOf(DataNotFoundException.class)
                .hasMessageContaining("User not registered yet!");
    }

    @Test
    @DisplayName("sendResetLink should throw when user not verified")
    void testSendResetLink_NotVerified() {
        user.setVerified(false);

        when(userRepository.existsByEmail("john@example.com")).thenReturn(true);
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> userService.sendResetLink("john@example.com"))
                .isInstanceOf(UserVerificationException.class)
                .hasMessageContaining("User is not verified!");
    }

    @Test
    @DisplayName("sendResetLink should generate token, save user, and send email")
    void testSendResetLink_Success() throws Exception {
        user.setVerified(true);

        when(userRepository.existsByEmail("john@example.com")).thenReturn(true);
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(jwtUtil.generateVerificationToken("john@example.com")).thenReturn("reset123");
        when(userRepository.save(any(User.class))).thenReturn(user);
        boolean result = userService.sendResetLink("john@example.com");

        assertThat(result).isTrue();
        assertThat(user.getResetToken()).isEqualTo("reset123");
        then(emailService).should().sendForgotPasswordEmail("john@example.com", "reset123");
    }

    // ---------------------------------------------------------------
    // update
    // ---------------------------------------------------------------
    @Test
    @DisplayName("update should update password and save")
    void testUpdate() throws Exception {
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("secret")).thenReturn("encodedPass");
        when(userRepository.save(user)).thenReturn(user);

        User updated = userService.update(userDto);

        assertThat(updated.getPassword()).isEqualTo("encodedPass");
    }

    @Test
    @DisplayName("update should throw when user not found")
    void testUpdate_NotFound() {
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.update(userDto))
                .isInstanceOf(DataNotFoundException.class);
    }

    // ---------------------------------------------------------------
    // deleteByEmail
    // ---------------------------------------------------------------
    @Test
    @DisplayName("deleteByEmail should delete user")
    void testDeleteByEmail() throws Exception {
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));

        boolean result = userService.deleteByEmail(userDto);

        assertThat(result).isTrue();
        then(userRepository).should().deleteByEmail("john@example.com");
    }

    @Test
    @DisplayName("deleteByEmail should throw when user not found")
    void testDeleteByEmail_NotFound() {
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.deleteByEmail(userDto))
                .isInstanceOf(DataNotFoundException.class);
    }


}