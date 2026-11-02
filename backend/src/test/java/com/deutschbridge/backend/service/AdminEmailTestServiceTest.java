package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.MailServerException;
import com.deutschbridge.backend.model.enums.EmailErrorCategory;
import jakarta.mail.AuthenticationFailedException;
import jakarta.mail.SendFailedException;
import org.junit.jupiter.api.Test;

import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AdminEmailTestServiceTest {

    @Test
    void classifiesAuthenticationFailure() {
        assertEquals(EmailErrorCategory.AUTHENTICATION_FAILED,
                AdminEmailTestService.classify(new MailServerException("x", new AuthenticationFailedException("535 bad creds"))));
    }

    @Test
    void classifiesConnectionAndDnsFailures() {
        assertEquals(EmailErrorCategory.CONNECTION_FAILED,
                AdminEmailTestService.classify(new MailServerException("x", new RuntimeException(new ConnectException("refused")))));
        assertEquals(EmailErrorCategory.CONNECTION_FAILED,
                AdminEmailTestService.classify(new MailServerException("x", new UnknownHostException("nohost"))));
    }

    @Test
    void classifiesTimeout() {
        assertEquals(EmailErrorCategory.TIMEOUT,
                AdminEmailTestService.classify(new MailServerException("x", new SocketTimeoutException("Read timed out"))));
    }

    @Test
    void classifiesRejectedRecipientAndSender() {
        assertEquals(EmailErrorCategory.INVALID_RECIPIENT,
                AdminEmailTestService.classify(new MailServerException("x", new SendFailedException("550 user unknown"))));
        assertEquals(EmailErrorCategory.SENDER_REJECTED,
                AdminEmailTestService.classify(new MailServerException("x", new SendFailedException("550 sender not allowed to send"))));
    }

    @Test
    void invalidAddressIsInvalidRecipient() {
        assertEquals(EmailErrorCategory.INVALID_RECIPIENT,
                AdminEmailTestService.classify(new IllegalArgumentException("Invalid email: foo")));
    }

    @Test
    void unknownFallsThrough() {
        assertEquals(EmailErrorCategory.UNKNOWN, AdminEmailTestService.classify(new RuntimeException("boom")));
    }
}
