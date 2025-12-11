package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.exception.UserVerificationException;
import com.deutschbridge.backend.model.dto.UserDto;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.UserRole;
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
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.*;

class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock JWTUtil jwtUtil;
    @Mock private EmailService emailService;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User user;
    private UserDto userDto;

    @BeforeEach
    void setup() {

        MockitoAnnotations.openMocks(this);
        user = new User("john", "john@example.com", "pass", UserRole.STUDENT.getValue());
        user.setVerified(true);

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
    @DisplayName("registerUser should throw when username exists")
    void testRegisterUser_UsernameExists() {
        when(userRepository.findByUsername("john")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> userService.registerUser(userDto))
                .isInstanceOf(UserVerificationException.class)
                .hasMessageContaining("Username already exists");
    }

    @Test
    @DisplayName("registerUser should throw when email is already registered")
    void testRegisterUser_EmailExists() {
        when(userRepository.findByUsername("john")).thenReturn(Optional.empty());
        when(userRepository.existsByEmail("john@example.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.registerUser(userDto))
                .isInstanceOf(UserVerificationException.class)
                .hasMessageContaining("Email already registered");
    }

    @Test
    @DisplayName("registerUser should throw when existing user is already verified")
    void testRegisterUser_UserAlreadyVerified() {
        when(userRepository.findByUsername("john")).thenReturn(Optional.empty());
        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));

        user.setVerified(true);

        assertThatThrownBy(() -> userService.registerUser(userDto))
                .isInstanceOf(UserVerificationException.class)
                .hasMessageContaining("User is already verified");
    }

    @Test
    @DisplayName("registerUser should update existing unverified user and send email")
    void testRegisterUser_ExistingUnverifiedUser() throws Exception {
        user.setVerified(false);

        when(userRepository.findByUsername("john")).thenReturn(Optional.empty());
        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken("john@example.com")).thenReturn("token123");
        when(userRepository.save(user)).thenReturn(user);

        User result = userService.registerUser(userDto);

        assertThat(result.getVerificationToken()).isEqualTo("token123");
        then(emailService).should().sendVerificationEmail("john@example.com", "token123");
    }

    @Test
    @DisplayName("registerUser should create new user when no conflicts")
    void testRegisterUser_NewUser() throws Exception {
        when(userRepository.findByUsername("john")).thenReturn(Optional.empty());
        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("secret")).thenReturn("hashedPassword");
        when(jwtUtil.generateToken("john@example.com")).thenReturn("token123");

        User savedUser = new User("john", "john@example.com", "hashedPassword", UserRole.STUDENT.getValue());
        savedUser.setVerificationToken("token123");

        given(userRepository.save(any(User.class))).willReturn(savedUser);

        User result = userService.registerUser(userDto);

        assertThat(result.getVerificationToken()).isEqualTo("token123");
    }

    // ---------------------------------------------------------------
    // resetPassword
    // ---------------------------------------------------------------
    @Test
    @DisplayName("resetPassword should throw when user doesn't exist")
    void testResetPassword_UserNotFound() {
        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);

        assertThatThrownBy(() -> userService.resetPassword("john@example.com"))
                .isInstanceOf(DataNotFoundException.class)
                .hasMessageContaining("User not registered yet!");
    }

    @Test
    @DisplayName("resetPassword should throw when user not verified")
    void testResetPassword_NotVerified() {
        user.setVerified(false);

        when(userRepository.existsByEmail("john@example.com")).thenReturn(true);
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> userService.resetPassword("john@example.com"))
                .isInstanceOf(UserVerificationException.class)
                .hasMessageContaining("User is not verified!");
    }

    @Test
    @DisplayName("resetPassword should generate token, save user, and send email")
    void testResetPassword_Success() throws Exception {
        user.setVerified(true);

        when(userRepository.existsByEmail("john@example.com")).thenReturn(true);
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken("john@example.com")).thenReturn("reset123");

        boolean result = userService.resetPassword("john@example.com");

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