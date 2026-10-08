package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.ExamContentStatus;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

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

    /** Learner-visibility flag. Always kept in sync with {@code status == PUBLISHED} - see {@link #applyStatus}. */
    private boolean published = true;
    private LocalDateTime createdAt;

    /** Which exam this exercise prepares for (Telc, Goethe, TestDaF ...). Existing content is Telc. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExamType examType = ExamType.TELC;

    /** Editorial workflow state; null only transiently before {@link #prePersist} derives it from {@code published}. */
    @Enumerated(EnumType.STRING)
    private ExamContentStatus status;

    /** Id from the imported JSON file (e.g. "B1-L1-001"); unique per exam type, null for hand-made exercises. */
    private String externalId;

    /** Import schema / generation-prompt versions the content was produced under. */
    private String schemaVersion;
    private String promptVersion;

    /** Free-form import metadata: difficulty, topics, skills, source ... */
    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    /** SHA-256 of the normalised passage texts - cheap exact-duplicate lookup. */
    private String contentHash;

    /** Bumped on every admin edit so changes to live content are traceable. */
    @Column(nullable = false)
    private int version = 1;

    private String createdBy;
    private String updatedBy;
    private LocalDateTime updatedAt;
    private LocalDateTime publishedAt;

    /** Moves the exercise to {@code target}, keeping the learner-facing {@code published} flag and timestamps consistent. */
    public void applyStatus(ExamContentStatus target) {
        this.status = target;
        boolean nowPublished = target == ExamContentStatus.PUBLISHED;
        if (nowPublished && !this.published) {
            this.publishedAt = LocalDateTime.now();
        }
        if (nowPublished && this.publishedAt == null) {
            this.publishedAt = LocalDateTime.now();
        }
        this.published = nowPublished;
    }

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = this.createdAt;
        }
        if (this.examType == null) {
            this.examType = ExamType.TELC;
        }
        if (this.status == null) {
            applyStatus(this.published ? ExamContentStatus.PUBLISHED : ExamContentStatus.DRAFT);
        }
    }
}
