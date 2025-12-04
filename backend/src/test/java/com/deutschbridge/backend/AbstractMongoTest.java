package com.deutschbridge.backend;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;

public abstract class AbstractMongoTest {
    @Container
    static MongoDBContainer mongo = new MongoDBContainer("mongo:7.0.9");

    @DynamicPropertySource
    static void mongoProperties(DynamicPropertyRegistry registry) {
        // Spring Boot automatically configures this as mongo connection string
        registry.add("spring.data.mongodb.uri", mongo::getReplicaSetUrl);
    }

}
