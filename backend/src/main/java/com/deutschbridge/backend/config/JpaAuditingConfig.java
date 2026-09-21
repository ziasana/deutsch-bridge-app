package com.deutschbridge.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/** Enables @CreatedDate/@LastModifiedDate auditing fields (e.g. User.createdAt). */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}
