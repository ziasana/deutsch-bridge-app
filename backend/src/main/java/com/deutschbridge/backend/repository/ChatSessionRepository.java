package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.dto.ChatSessionDto;
import com.deutschbridge.backend.model.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, String> {
    List<ChatSessionDto> findByUserId(String userId);
}
