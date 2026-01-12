package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.exception.MailServerException;
import com.deutschbridge.backend.exception.UserVerificationException;
import com.deutschbridge.backend.model.dto.TestDto;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
public class TestExceptionController {

    @GetMapping("/not-found")
    public void notFound() throws DataNotFoundException {
        throw new DataNotFoundException("Data not found");
    }

    @GetMapping("/bad-request")
    public void badRequest() throws UserVerificationException {
        throw new UserVerificationException("User not verified");
    }

    @GetMapping("/error")
    public void error() {
        throw new RuntimeException("Unexpected error");
    }

    @PostMapping("/validation")
    public void validation(@Valid @RequestBody TestDto dto) {
    }

    @GetMapping("/mail-error")
    public void mailServer() {
        throw new MailServerException("Mail service is currently unavailable");
    }
}
