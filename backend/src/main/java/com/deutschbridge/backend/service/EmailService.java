package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.MailServerException;
import com.deutschbridge.backend.model.enums.EmailTestType;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.UnsupportedEncodingException;


@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    // Sender address. MAIL_FROM lets mail go out as an alias (e.g. noreply@) while the SMTP login stays the real mailbox.
    @Value("${MAIL_FROM:${spring.mail.username}}")
    private String from ="";
    // Display name shown next to the sender address; without it the mail server shows the mailbox's own name (e.g. "info").
    @Value("${MAIL_FROM_NAME:DeutschCertify}")
    private String fromName = "";

    public static final String VERIFICATION_ENDPOINT = "/req/signup/verify"; // Compliant path is relative and has only two parts
    public static final String RESET_PASSWORD_ENDPOINT = "/req/reset-password"; // Compliant path is relative and has only two parts

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void setFrom(String from) {
        this.from = from;
    }

    public void sendVerificationEmail(String email, String verificationToken)  {
        String subject = "Email Verification";
        String message = "Click the button below to verify your email address:";
        sendEmail(email, verificationToken, subject, VERIFICATION_ENDPOINT, message);
    }

    public void sendForgotPasswordEmail(String email, String resetToken) {
        String subject = "Password Reset Request";
        String message = "Click the button below to reset your password:";
        sendEmail(email, resetToken, subject, RESET_PASSWORD_ENDPOINT, message);
    }

    private void sendEmail(String email, String token, String subject, String path, String message) throws IllegalArgumentException {
        try {

           if (email == null || !email.contains("@")) {
                throw new IllegalArgumentException("Invalid email: " + email);
            }
            String actionUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path(path)
                    .queryParam("token", token)
                    .toUriString();

            String content = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border-radius: 8px; background-color: #f9f9f9; text-align: center;">
                    <h2 style="color: #333;">%s</h2>
                    <p style="font-size: 16px; color: #555; white-space: normal; overflow-wrap: break-word;">
                        %s
                    </p>
                    <a href="%s" style="display: inline-block; margin: 20px 0; padding: 10px 20px;
                       font-size: 16px; color: #fff; background-color: #007bff;
                       text-decoration: none; border-radius: 5px;">
                        Proceed
                    </a>
                    <p style="font-size: 14px; color: #555; white-space: normal; overflow-wrap: break-word;">
                        Or copy and paste this link into your browser:
                    </p>
                    <p style="font-size: 14px; color: #007bff; overflow-wrap: break-word;">
                        %s
                    </p>
                    <p style="font-size: 12px; color: gray; white-space: normal; overflow-wrap: break-word;">
                    This is an automated message. Please do not reply.
                    </p>
            
                </div>
                """.formatted(subject, message, actionUrl, actionUrl);

            deliver(email, subject, content);

        } catch (MailException | MessagingException | UnsupportedEncodingException ex) {
            // SMTP auth/connection failures are often thrown without a wrapped cause, so fall
            // back to the exception itself rather than NPE-ing on a null getCause().
            Throwable root = ex.getCause() != null ? ex.getCause() : ex;
            log.error("Failed to send email to {}: {}", email, root.getMessage(), ex);
            throw new MailServerException("Mail server error: " + root.getMessage(), ex);
        }
    }

    private void deliver(String email, String subject, String content) throws MessagingException, UnsupportedEncodingException {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true);

        helper.setTo(email);
        helper.setSubject(subject);
        if (fromName == null || fromName.isBlank()) {
            helper.setFrom(from);
        } else {
            helper.setFrom(from, fromName);
        }
        helper.setText(content, true);
        mailSender.send(mimeMessage);
    }

    /**
     * Admin diagnostics: sends through the exact same path as real emails. VERIFICATION and PASSWORD_RESET use the
     * real templates with a placeholder token, so nothing is stored on any user and the link is intentionally dead.
     *
     * @throws MailServerException with the original exception as cause when delivery fails
     */
    public void sendTestEmail(String email, EmailTestType type) {
        String placeholderToken = "TEST-TOKEN-NOT-VALID";
        switch (type) {
            case VERIFICATION -> sendEmail(email, placeholderToken, "[TEST] Email Verification",
                    VERIFICATION_ENDPOINT, "This is a test of the verification email. The link below is not valid.");
            case PASSWORD_RESET -> sendEmail(email, placeholderToken, "[TEST] Password Reset Request",
                    RESET_PASSWORD_ENDPOINT, "This is a test of the password reset email. The link below is not valid.");
            case TEST -> {
                String content = """
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border-radius: 8px; background-color: #f9f9f9; text-align: center;">
                        <h2 style="color: #333;">Test email</h2>
                        <p style="font-size: 16px; color: #555;">
                            If you can read this, outgoing email from DeutschCertify is working.
                        </p>
                        <p style="font-size: 12px; color: gray;">Sent from the admin email test tool.</p>
                    </div>
                    """;
                try {
                    if (email == null || !email.contains("@")) {
                        throw new IllegalArgumentException("Invalid email: " + email);
                    }
                    deliver(email, "[TEST] DeutschCertify email check", content);
                } catch (MailException | MessagingException | UnsupportedEncodingException ex) {
                    Throwable root = ex.getCause() != null ? ex.getCause() : ex;
                    log.error("Failed to send test email to {}: {}", email, root.getMessage(), ex);
                    throw new MailServerException("Mail server error: " + root.getMessage(), ex);
                }
            }
        }
    }

    public String getFrom() {
        return from;
    }

    public String getFromName() {
        return fromName;
    }

    /** Host of the configured SMTP server, or null if the sender is not the standard implementation. */
    public String getSmtpHost() {
        return mailSender instanceof JavaMailSenderImpl impl ? impl.getHost() : null;
    }

    public Integer getSmtpPort() {
        return mailSender instanceof JavaMailSenderImpl impl ? impl.getPort() : null;
    }

    public String getSmtpUsername() {
        return mailSender instanceof JavaMailSenderImpl impl ? impl.getUsername() : null;
    }
}
