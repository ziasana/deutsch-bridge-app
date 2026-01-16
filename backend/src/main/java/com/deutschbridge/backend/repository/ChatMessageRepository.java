package com.deutschbridge.backend.repository;


import com.deutschbridge.backend.model.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, String> {

    List<ChatMessage> findChatMessagesByChatSession_Id(String sessionId);

}
