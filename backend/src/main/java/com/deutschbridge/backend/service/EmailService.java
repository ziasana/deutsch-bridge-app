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
import org.springframework.web.util.HtmlUtils;

import java.io.UnsupportedEncodingException;


@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    // Sender address. MAIL_FROM lets mail go out as an alias (e.g. noreply@) while the SMTP login stays the real mailbox.
    @Value("${MAIL_FROM:${spring.mail.username}}")
    private String from ="";
    // Display name shown next to the sender address; without it the mail server shows the mailbox's own name (e.g. "info").
    @Value("${MAIL_FROM_NAME:Deutsch Certify Team}")
    private String fromName = "";

    // Public site, used for absolute links and the logo inside emails (mail clients cannot load relative or localhost URLs).
    private static final String SITE_URL = "https://deutschcertify.com";

    public static final String VERIFICATION_ENDPOINT = "/req/signup/verify"; // Compliant path is relative and has only two parts
    public static final String RESET_PASSWORD_ENDPOINT = "/req/reset-password"; // Compliant path is relative and has only two parts

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void setFrom(String from) {
        this.from = from;
    }

    public void sendVerificationEmail(String email, String verificationToken)  {
        sendEmail(email, verificationToken, "Confirm your email and start learning German", "Verify your email",
                VERIFICATION_ENDPOINT,
                "Welcome to Deutsch Certify! Confirm your email address to activate your account and start preparing for your German exam.",
                "Verify my email",
                "If you didn't create a Deutsch Certify account, you can safely ignore this email.");
    }

    public void sendForgotPasswordEmail(String email, String resetToken) {
        sendEmail(email, resetToken, "Reset your Deutsch Certify password", "Reset your password",
                RESET_PASSWORD_ENDPOINT,
                "We received a request to reset the password of your Deutsch Certify account. Click the button below to choose a new one.",
                "Reset password",
                "If you didn't ask for a new password, you can ignore this email. Your password stays the same.");
    }

    private void sendEmail(String email, String token, String subject, String heading, String path, String message,
                           String buttonLabel, String footnote) throws IllegalArgumentException {
        try {

           if (email == null || !email.contains("@")) {
                throw new IllegalArgumentException("Invalid email: " + email);
            }
            String actionUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path(path)
                    .queryParam("token", token)
                    .toUriString();

            deliver(email, subject, brandedEmail(heading, message, buttonLabel, actionUrl, footnote));

        } catch (MailException | MessagingException | UnsupportedEncodingException ex) {
            // SMTP auth/connection failures are often thrown without a wrapped cause, so fall
            // back to the exception itself rather than NPE-ing on a null getCause().
            Throwable root = ex.getCause() != null ? ex.getCause() : ex;
            log.error("Failed to send email to {}: {}", email, root.getMessage(), ex);
            throw new MailServerException("Mail server error: " + root.getMessage(), ex);
        }
    }

    // Brand colours (frontend globals.css): navy primary, gold accent, soft blue-grey page background.
    private static final String NAVY = "#16324f";
    private static final String GOLD = "#f2b544";
    private static final String TEXT = "#253449";
    private static final String MUTED = "#6b7a90";

    /**
     * The shared Deutsch Certify email layout: navy header with the logo, white card with heading, text and a gold
     * call-to-action button, and a quiet footer. Built from tables with inline styles because mail clients ignore
     * most modern CSS. {@code buttonLabel}/{@code actionUrl}/{@code footnote} may be null for plain notices.
     */
    static String brandedEmail(String heading, String message, String buttonLabel, String actionUrl, String footnote) {
        StringBuilder body = new StringBuilder();
        body.append("<h1 style=\"margin:0 0 12px;font-size:24px;line-height:1.3;color:").append(NAVY).append(";\">")
                .append(HtmlUtils.htmlEscape(heading)).append("</h1>")
                .append("<p style=\"margin:0 0 24px;font-size:16px;line-height:1.6;color:").append(TEXT).append(";\">")
                .append(HtmlUtils.htmlEscape(message)).append("</p>");
        if (actionUrl != null && buttonLabel != null) {
            String url = HtmlUtils.htmlEscape(actionUrl);
            body.append("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:0 0 28px;\"><tr>")
                    .append("<td style=\"border-radius:10px;background:").append(GOLD).append(";\">")
                    .append("<a href=\"").append(url).append("\" style=\"display:inline-block;padding:14px 28px;font-size:16px;font-weight:700;color:")
                    .append(NAVY).append(";text-decoration:none;border-radius:10px;\">").append(HtmlUtils.htmlEscape(buttonLabel)).append("</a>")
                    .append("</td></tr></table>")
                    .append("<p style=\"margin:0 0 4px;font-size:13px;color:").append(MUTED).append(";\">Button not working? Copy and paste this link into your browser:</p>")
                    .append("<p style=\"margin:0 0 24px;font-size:13px;line-height:1.5;word-break:break-all;\"><a href=\"").append(url)
                    .append("\" style=\"color:").append(NAVY).append(";\">").append(url).append("</a></p>");
        }
        if (footnote != null) {
            body.append("<p style=\"margin:0;padding-top:20px;border-top:1px solid #e6ebf2;font-size:13px;line-height:1.6;color:")
                    .append(MUTED).append(";\">").append(HtmlUtils.htmlEscape(footnote)).append("</p>");
        }

        return """
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Deutsch Certify</title></head>
            <body style="margin:0;padding:0;background:#f6f8fc;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fc;padding:24px 12px;">
                <tr><td align="center">
                  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;font-family:Poppins,'Segoe UI',Helvetica,Arial,sans-serif;">
                    <tr><td style="background:@NAVY@;border-radius:16px 16px 0 0;padding:22px 32px;">
                      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                        <td style="padding-right:12px;"><img src="@LOGO@" width="40" height="40" alt="" style="display:block;border-radius:10px;"></td>
                        <td style="font-size:22px;font-weight:700;color:#ffffff;">Deutsch Certify</td>
                      </tr></table>
                    </td></tr>
                    <tr><td style="background:#ffffff;padding:36px 32px 32px;border-left:1px solid #e6ebf2;border-right:1px solid #e6ebf2;">
                      @BODY@
                    </td></tr>
                    <tr><td style="background:#ffffff;border:1px solid #e6ebf2;border-top:0;border-radius:0 0 16px 16px;padding:0 32px 28px;">
                      <p style="margin:0;font-size:12px;line-height:1.6;color:@MUTED@;">
                        <strong style="color:@NAVY@;">Learn. Practice. Certify.</strong><br>
                        Deutsch Certify &middot; <a href="@SITE@" style="color:@MUTED@;">deutschcertify.com</a><br>
                        This is an automated message, please do not reply.
                      </p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.replace("@NAVY@", NAVY).replace("@MUTED@", MUTED).replace("@LOGO@", SITE_URL + "/favicon-192.png")
                .replace("@SITE@", SITE_URL).replace("@BODY@", body);
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
            case VERIFICATION -> sendEmail(email, placeholderToken, "[TEST] Confirm your email and start learning German", "[TEST] Verify your email",
                    VERIFICATION_ENDPOINT, "This is a test of the verification email. The link below is not valid.",
                    "Verify my email", "Sent from the admin email test tool.");
            case PASSWORD_RESET -> sendEmail(email, placeholderToken, "[TEST] Reset your Deutsch Certify password", "[TEST] Reset your password",
                    RESET_PASSWORD_ENDPOINT, "This is a test of the password reset email. The link below is not valid.",
                    "Reset password", "Sent from the admin email test tool.");
            case TEST -> {
                String content = brandedEmail("Test email", "If you can read this, outgoing email from Deutsch Certify is working.",
                        null, null, "Sent from the admin email test tool.");
                try {
                    if (email == null || !email.contains("@")) {
                        throw new IllegalArgumentException("Invalid email: " + email);
                    }
                    deliver(email, "[TEST] Deutsch Certify email check", content);
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
