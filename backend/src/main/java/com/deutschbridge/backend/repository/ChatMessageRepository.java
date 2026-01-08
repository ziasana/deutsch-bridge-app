package com.deutschbridge.backend.repository;


import com.deutschbridge.backend.model.entity.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {

    List<ChatMessage> findBySessionId(String sessionId);

}
