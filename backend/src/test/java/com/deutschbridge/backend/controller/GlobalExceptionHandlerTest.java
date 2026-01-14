package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.MediaType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@Import(GlobalExceptionHandler.class)
@AutoConfigureMockMvc
class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvc mockMvc;

    // -------------------------------------------------------------------------
    // GET /api/test/not-foun
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("get /api/test/error -> throw not found exception")
    void shouldReturn404_whenDataNotFound() throws Exception {
        mockMvc.perform(get("/api/test/not-found"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Data not found"))
                .andExpect(jsonPath("$.status").value(404));
    }


    // -------------------------------------------------------------------------
    // GET /api/test/bad-request
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("get /api/test/bad-request -> throw user not verified exception")
    void shouldReturn400_whenUserVerificationFails() throws Exception {
        mockMvc.perform(get("/api/test/bad-request"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("User not verified"))
                .andExpect(jsonPath("$.status").value(400));
    }


    // -------------------------------------------------------------------------
    // GET /api/test/error
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("get /api/test/error -> throw unexcepted exception")
    void shouldReturn500_whenUnexpectedException() throws Exception {
        mockMvc.perform(get("/api/test/error"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("Unexpected error"))
                .andExpect(jsonPath("$.status").value(500));
    }

    // -------------------------------------------------------------------------
    // POST /api/test/validation
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("post /api/test/validation -> throw validation error")
    void shouldReturnValidationErrors() throws Exception {
        mockMvc.perform(post("/api/test/validation")
                        .contentType(String.valueOf(MediaType.APPLICATION_JSON))
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.name").exists());
    }


    // -------------------------------------------------------------------------
    // GET /api/test/mail-error
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("get /api/test/mail-error -> throw mail server error")
    void shouldReturn503_whenMailServerFails() throws Exception {
        mockMvc.perform(get("/api/test/mail-error"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value(503))
                .andExpect(jsonPath("$.message")
                        .value("Mail service is currently unavailable"));
    }
}
