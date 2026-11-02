package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.MailServerException;
import com.deutschbridge.backend.model.dto.EmailConfigResponse;
import com.deutschbridge.backend.model.entity.EmailSendLog;
import com.deutschbridge.backend.model.enums.EmailErrorCategory;
import com.deutschbridge.backend.model.enums.EmailSendStatus;
import com.deutschbridge.backend.model.enums.EmailTestType;
import com.deutschbridge.backend.repository.EmailSendLogRepository;
import com.deutschbridge.backend.repository.UserRepository;
import jakarta.mail.AuthenticationFailedException;
import jakarta.mail.MessagingException;
import jakarta.mail.SendFailedException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import javax.net.ssl.SSLException;
import java.net.ConnectException;
import java.net.NoRouteToHostException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.util.List;
import java.util.Locale;

/** Sends diagnostic emails on behalf of an admin and records exactly what happened. */
@Service
public class AdminEmailTestService {

    private static final int RECENT_LIMIT = 100;
    private static final int MAX_DETAIL = 4000;
    private static final int MAX_MESSAGE = 2000;

    private final EmailService emailService;
    private final EmailSendLogRepository logRepository;
    private final UserRepository userRepository;

    public AdminEmailTestService(EmailService emailService,
                                 EmailSendLogRepository logRepository,
                                 UserRepository userRepository) {
        this.emailService = emailService;
        this.logRepository = logRepository;
        this.userRepository = userRepository;
    }

    /** Always returns a persisted log entry; delivery failures are captured in it rather than thrown. */
    public EmailSendLog send(String recipientEmail, EmailTestType type, String adminEmail) {
        String email = recipientEmail.trim();
        EmailSendLog entry = new EmailSendLog();
        entry.setRecipientEmail(email);
        entry.setRecipientUserId(userRepository.findByEmail(email).map(u -> u.getId()).orElse(null));
        entry.setEmailType(type);
        entry.setSentByAdminEmail(adminEmail);
        entry.setSmtpHost(emailService.getSmtpHost());
        entry.setSmtpPort(emailService.getSmtpPort());
        entry.setFromAddress(emailService.getFrom());

        long start = System.nanoTime();
        try {
            emailService.sendTestEmail(email, type);
            entry.setStatus(EmailSendStatus.SUCCESS);
        } catch (RuntimeException ex) {
            entry.setStatus(EmailSendStatus.FAILED);
            Throwable root = rootCause(ex);
            EmailErrorCategory category = classify(ex);
            entry.setErrorCategory(category);
            entry.setErrorMessage(truncate(describe(category, root), MAX_MESSAGE));
            entry.setErrorDetail(truncate(chain(ex), MAX_DETAIL));
        }
        entry.setDurationMs((System.nanoTime() - start) / 1_000_000);
        return logRepository.save(entry);
    }

    public List<EmailSendLog> findRecent() {
        return logRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, RECENT_LIMIT));
    }

    public EmailConfigResponse config() {
        return new EmailConfigResponse(emailService.getSmtpHost(), emailService.getSmtpPort(),
                emailService.getSmtpUsername(), emailService.getFrom(), emailService.getFromName());
    }

    static EmailErrorCategory classify(Throwable ex) {
        EmailErrorCategory found = null;
        for (Throwable t = ex; t != null && t.getCause() != t; t = t.getCause()) {
            String msg = t.getMessage() == null ? "" : t.getMessage().toLowerCase(Locale.ROOT);
            if (t instanceof IllegalArgumentException) return EmailErrorCategory.INVALID_RECIPIENT;
            if (t instanceof AuthenticationFailedException) return EmailErrorCategory.AUTHENTICATION_FAILED;
            if (t instanceof SocketTimeoutException) return EmailErrorCategory.TIMEOUT;
            if (t instanceof SSLException) return EmailErrorCategory.TLS_ERROR;
            if (t instanceof UnknownHostException || t instanceof ConnectException
                    || t instanceof NoRouteToHostException) {
                found = EmailErrorCategory.CONNECTION_FAILED;
            } else if (t instanceof SendFailedException) {
                // Server answered: 550/553 style "user unknown"/"relay denied", or a rejected sender.
                if (msg.contains("sender") || msg.contains("from address") || msg.contains("not allowed to send")) {
                    return EmailErrorCategory.SENDER_REJECTED;
                }
                return EmailErrorCategory.INVALID_RECIPIENT;
            } else if (t instanceof MessagingException && msg.contains("could not connect")) {
                found = EmailErrorCategory.CONNECTION_FAILED;
            } else if (msg.contains("timed out")) {
                return EmailErrorCategory.TIMEOUT;
            }
        }
        return found != null ? found : EmailErrorCategory.UNKNOWN;
    }

    private static String describe(EmailErrorCategory category, Throwable root) {
        String raw = root.getMessage() == null ? root.getClass().getSimpleName() : root.getMessage();
        String hint = switch (category) {
            case INVALID_RECIPIENT -> "The recipient address was rejected or is malformed.";
            case AUTHENTICATION_FAILED -> "SMTP login failed. Check MAIL_USERNAME / MAIL_PASSWORD (and that the relay key is active).";
            case CONNECTION_FAILED -> "Could not reach the SMTP server. Check MAIL_HOST / MAIL_PORT and whether the host blocks that outbound port.";
            case TIMEOUT -> "The SMTP server did not respond in time. Often a blocked or filtered port.";
            case TLS_ERROR -> "TLS/SSL handshake failed. Check STARTTLS/SSL settings and the trusted host.";
            case SENDER_REJECTED -> "The server refused the sender address. Check MAIL_FROM is a verified sender on the SMTP provider.";
            case UNKNOWN -> "Unclassified mail error.";
        };
        return hint + " Server said: " + raw;
    }

    private static Throwable rootCause(Throwable ex) {
        Throwable t = ex;
        while (t.getCause() != null && t.getCause() != t) t = t.getCause();
        return t;
    }

    private static String chain(Throwable ex) {
        StringBuilder sb = new StringBuilder();
        for (Throwable t = ex; t != null && t.getCause() != t; t = t.getCause()) {
            if (sb.length() > 0) sb.append("\n -> ");
            sb.append(t.getClass().getName()).append(": ").append(t.getMessage());
        }
        return sb.toString();
    }

    private static String truncate(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max - 1) + "…";
    }
}
