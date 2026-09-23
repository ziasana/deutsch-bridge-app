package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.NotificationTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, String> {

    Optional<NotificationTemplate> findByTemplateKeyAndLanguage(String templateKey, String language);

    List<NotificationTemplate> findAllByOrderByTemplateKeyAscLanguageAsc();
}
