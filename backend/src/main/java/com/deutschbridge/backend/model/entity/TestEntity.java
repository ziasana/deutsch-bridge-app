package com.deutschbridge.backend.model.entity;

import org.springframework.data.mongodb.core.mapping.Document;

@Document("test")
public record TestEntity(int id, String name, String description) {
}
