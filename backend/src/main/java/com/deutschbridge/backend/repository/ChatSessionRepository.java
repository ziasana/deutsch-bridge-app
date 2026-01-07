package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.dto.ChatSessionDto;
import com.deutschbridge.backend.model.entity.ChatSession;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatSessionRepository extends MongoRepository<ChatSession, String> {
    List<ChatSessionDto> findByUserId(String userId);
}
