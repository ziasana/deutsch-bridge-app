package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.junit.jupiter.api.Assertions.*;
@SpringBootTest
@RunWith(SpringRunner.class)
@ActiveProfiles("test")
@Import(GlobalExceptionHandler.class)
@AutoConfigureMockMvc

@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)

class OllamaControllerTest {

    @Test
    void test() {
        String chat = "test";
        assertNotNull(chat);
    }
}