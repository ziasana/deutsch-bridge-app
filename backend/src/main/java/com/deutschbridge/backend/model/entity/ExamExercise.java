package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;
import java.util.List;

@Entity(name = "examExercises")
@Table(indexes = @Index(name = "idx_exam_exercises_section_level", columnList = "section, level"))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamExercise {
    @Id
    private String id;
    private String title;

    @Enumerated(EnumType.STRING)
    private ExamSection section;

    @Enumerated(EnumType.STRING)
    private ExamTaskType taskType;

    @Enumerated(EnumType.STRING)
    private LearningLevel level;

    /** Optional Telc "Teil 1/2/3" grouping within a level + taskType. */
    private Integer partNumber;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<ExamPassage> passages;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<ExamQuestion> questions;

    /**
     * MATCHING only: the shared pool of candidate headlines/titles shown alongside every passage
     * (real Telc Teil 1 always includes more headlines than passages, so some are distractors -
     * each question's correctAnswer must match exactly one entry here).
     */
    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<String> answerOptions;

    /**
     * Optional labels shown in front of each answerOptions entry (e.g. "a", "b" or "1", "2"),
     * matched by index. A missing or blank entry means "use the default positional letter".
     */
    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<String> answerOptionLabels;

    /** Fallback explanation/commonMistake used when a question's own fields are blank. */
    private @Column(columnDefinition = "TEXT") String defaultExplanation;
    private @Column(columnDefinition = "TEXT") String defaultCommonMistake;

    /** Shown to the student at the start of this Teil, before the passages/questions. */
    private @Column(columnDefinition = "TEXT") String teilDescription;

    /** SCHRIFTLICHER_AUSDRUCK only: the "mögliche Antwort" a student can reveal via a button. */
    private @Column(columnDefinition = "TEXT") String modelSolution;

    /** SCHRIFTLICHER_AUSDRUCK only: offer the optional pre-writing planner for this task. */
    private boolean requiresPlanning;

    /** SCHRIFTLICHER_AUSDRUCK only: the task's Leitpunkte, used as prompts in the planner. */
    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<String> leitpunkte;

    private boolean published = true;
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
