package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.TestEntity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TestRepository extends MongoRepository<TestEntity, String> {
}
