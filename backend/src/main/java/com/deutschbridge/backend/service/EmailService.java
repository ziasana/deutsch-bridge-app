package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.MailServerException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;


@Service
public class EmailService {

    private final JavaMailSender mailSender;
    @Value("${spring.mail.username}")
    private String from ="";

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

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true);

            helper.setTo(email);
            helper.setSubject(subject);
            helper.setFrom(from);
            helper.setText(content, true);
            mailSender.send(mimeMessage);

        } catch (MailException | MessagingException ex) {
            // Log the real root cause
            Throwable root = ex.getCause();
            throw new MailServerException("Mail server error: " + root.getMessage());
        }
    }
}
