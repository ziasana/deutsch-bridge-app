package com.deutschbridge.backend;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication {


    public static void main(String[] args) throws DataNotFoundException {
        SpringApplication.run(BackendApplication.class, args);
    }

}
