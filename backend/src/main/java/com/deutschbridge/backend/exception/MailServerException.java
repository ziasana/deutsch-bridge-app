package com.deutschbridge.backend.exception;

public class MailServerException  extends RuntimeException {

    public MailServerException(String message) {
        super(message);
    }

    public MailServerException(String message, Throwable cause) {
        super(message, cause);
    }

}
