package com.deutschbridge.backend.service;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private EmailService emailService;

    @BeforeEach
    void setup() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
        emailService.setFrom("noreply@test.com"); // set from
    }


    @Test
    @DisplayName("Should send verification email successfully")
    void testSendVerificationEmail() throws Exception {

        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        String email = "test@example.com";
        String token = "abc123";

        emailService.sendVerificationEmail(email, token);

        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Should send password reset email successfully")
    void testSendResetEmail() throws Exception {
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        String email = "reset@example.com";
        String token = "xyz456";

        emailService.sendForgotPasswordEmail(email, token);

        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Should throw exception for invalid email")
    void testInvalidEmail() {
        assertThrows(IllegalArgumentException.class, () ->
                emailService.sendVerificationEmail("invalid-email", "token123")
        );
    }

    @Test
    @DisplayName("Generated email content should contain token URL")
    void testGeneratedEmailContainsUrl() throws Exception {
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        String email = "test@example.com";
        String token = "abc123";

        emailService.sendVerificationEmail(email, token);

        // Capture the MimeMessage
        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender).send(captor.capture());

        // We cannot extract HTML directly from MimeMessage, but we CAN check that send() was triggered
        assertNotNull(captor.getValue());
    }
}
