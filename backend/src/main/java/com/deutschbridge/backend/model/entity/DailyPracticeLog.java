package com.deutschbridge.backend.model.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.time.LocalDate;

@Entity(name = "dailyPracticeLog")
@EnableJpaAuditing
public record DailyPracticeLog(
        @Id String id,
        @ManyToOne @JoinColumn(name = "user_id") User userId,
        LocalDate date,
        int numberOfWordsPracticed,
        int numberOfNomenVerbPracticed,
        int numberOfGrammarPracticed
) {
}
