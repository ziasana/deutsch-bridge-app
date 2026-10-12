package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.ExamProfile;
import com.deutschbridge.backend.model.entity.ExamQuestion;
import com.deutschbridge.backend.model.entity.ExamPassage;
import com.deutschbridge.backend.model.enums.ExamContentStatus;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.dto.examsim.ExamProfileRequest;
import com.deutschbridge.backend.model.examsim.ExamPartConfig;
import com.deutschbridge.backend.model.examsim.ExamProfileConfig;
import com.deutschbridge.backend.model.examsim.ExerciseSnapshot;
import com.deutschbridge.backend.model.examsim.ProfileSnapshot;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Shared builders for the exam simulation tests. */
public final class ExamSimulationFixtures {

    public static final Instant T0 = Instant.parse("2026-01-10T09:00:00Z");

    private ExamSimulationFixtures() {
    }

    public static Clock clockAt(Instant instant) {
        return Clock.fixed(instant, ZoneOffset.UTC);
    }

    public static ExamScoringService scoringService() {
        return new ExamScoringService(List.of(new PerQuestionScorer(), new ManualRubricScorer(), new UnscoredScorer()));
    }

    public static ExamResultCalculator calculator() {
        return new ExamResultCalculator(scoringService(), clockAt(T0));
    }

    public static ExamProfile telcProfile() {
        ExamProfileRequest r = TelcB1ProfileFactory.request();
        ExamProfile p = new ExamProfile();
        p.setId("profile-1");
        p.setCode(r.code());
        p.setVersion(1);
        p.setProvider(r.provider());
        p.setExamName(r.examName());
        p.setTitle(r.title());
        p.setExamType(r.examType());
        p.setLevel(r.level());
        p.setOralScoringEnabled(r.oralScoringEnabled());
        p.setWrittenMaxPoints(r.writtenMaxPoints());
        p.setWrittenPassThreshold(r.writtenPassThreshold());
        p.setOralMaxPoints(r.oralMaxPoints());
        p.setOralPassThreshold(r.oralPassThreshold());
        p.setOverallResultPolicy(r.overallResultPolicy());
        p.setAnswerReleasePolicy(r.answerReleasePolicy());
        p.setConfig(r.config());
        return p;
    }

    public static ProfileSnapshot telcSnapshot(boolean oralScoring) {
        ExamProfile p = telcProfile();
        p.setOralScoringEnabled(oralScoring);
        return ProfileSnapshot.of(p);
    }

    /** An exercise snapshot with {@code questions} questions whose correct answer is always "A". */
    public static ExerciseSnapshot snapshot(String id, ExamSection section, int teil, int questions) {
        List<ExamQuestion> list = new ArrayList<>();
        for (int i = 1; i <= questions; i++) {
            ExamQuestion q = new ExamQuestion();
            q.setId(id + "-q" + i);
            q.setTaskType(ExamTaskType.MULTIPLE_CHOICE);
            q.setPrompt("Frage " + i);
            q.setOptions(List.of("A", "B", "C"));
            q.setCorrectAnswer("A");
            q.setQuestionNumber(i);
            list.add(q);
        }
        return new ExerciseSnapshot(id, 1, "Titel " + id, section, ExamTaskType.MULTIPLE_CHOICE, teil, null, List.of(), list, null, null, null, null,
                null, null, false, null);
    }

    /** Answers for the first {@code correct} questions right, the rest wrong. */
    public static Map<String, String> answers(ExerciseSnapshot s, int correct) {
        Map<String, String> m = new HashMap<>();
        int i = 0;
        for (ExamQuestion q : s.questions()) {
            m.put(q.getId(), i++ < correct ? "A" : "B");
        }
        return m;
    }

    public static ExamResultCalculator.PartInput input(ExerciseSnapshot s, int correct) {
        return new ExamResultCalculator.PartInput(List.of(s), answers(s, correct), false, null);
    }

    public static ExamResultCalculator.PartInput assessed(String points) {
        return new ExamResultCalculator.PartInput(List.of(), Map.of(), true,
                new PartScoringContext.Assessment(true, new BigDecimal(points), Map.of(), null));
    }

    public static ExamResultCalculator.PartInput unassessed() {
        return new ExamResultCalculator.PartInput(List.of(), Map.of(), true, null);
    }

    /** Inputs for every objective part with the given number of correct answers, keyed by part key. */
    public static Map<String, ExamResultCalculator.PartInput> objectiveInputs(ProfileSnapshot profile, Map<String, Integer> correctByPart) {
        Map<String, ExamResultCalculator.PartInput> inputs = new HashMap<>();
        for (ExamPartConfig part : profile.config().partsOrEmpty()) {
            if (part.questionCount() == null) continue;
            ExerciseSnapshot s = snapshot("ex-" + part.key(), part.section(), part.teil(), part.questionCount());
            inputs.put(part.key(), input(s, correctByPart.getOrDefault(part.key(), 0)));
        }
        return inputs;
    }

    public static ExamExercise publishedExercise(String id, ExamSection section, int partNumber, int questions) {
        ExamExercise e = new ExamExercise();
        e.setId(id);
        e.setTitle("Aufgabe " + id);
        e.setSection(section);
        e.setLevel(LearningLevel.B1);
        e.setExamType(ExamType.TELC);
        e.setTaskType(ExamTaskType.MULTIPLE_CHOICE);
        e.setPartNumber(partNumber);
        e.applyStatus(ExamContentStatus.PUBLISHED);
        List<ExamQuestion> qs = new ArrayList<>();
        for (int i = 1; i <= questions; i++) {
            ExamQuestion q = new ExamQuestion();
            q.setId(id + "-q" + i);
            q.setTaskType(ExamTaskType.MULTIPLE_CHOICE);
            q.setPrompt("Frage " + i);
            q.setOptions(List.of("A", "B", "C"));
            q.setCorrectAnswer("A");
            q.setQuestionNumber(i);
            qs.add(q);
        }
        e.setQuestions(qs);
        ExamPassage passage = new ExamPassage("p-" + id, "Text", "<p>Text</p>", null, section == ExamSection.HOERVERSTEHEN ? "/uploads/exam-audio/" + id + ".m4a" : null, null);
        e.setPassages(List.of(passage));
        return e;
    }

    public static ExamProfileConfig configWith(ExamProfileConfig base, List<ExamPartConfig> parts) {
        return new ExamProfileConfig(parts, base.timers(), base.scoreScale(), base.roundingMode());
    }

    /** A published exercise of the given level / task type usable in the exam simulation pool. */
    public static ExamExercise pooledExercise(String title, ExamSection section, int partNumber, ExamTaskType taskType, int questions, LearningLevel level) {
        ExamExercise e = publishedExercise(null, section, partNumber, questions);
        e.setId(null);
        e.setTitle(title);
        e.setLevel(level);
        e.setTaskType(taskType);
        e.getQuestions().forEach(q -> q.setId(null));
        e.getQuestions().forEach(q -> q.ensureId());
        e.getPassages().forEach(p -> p.setId(null));
        e.getPassages().forEach(p -> p.ensureId());
        if (section == ExamSection.HOERVERSTEHEN) e.getPassages().get(0).setAudioUrl("/uploads/exam-audio/" + title + ".m4a");
        return e;
    }

    /** Creates {@code perPart} eligible published exercises for every part of the telc B1 profile structure; returns their ids. */
    public static List<String> createPool(com.deutschbridge.backend.repository.ExamExerciseRepository repository, LearningLevel level, int perPart) {
        List<String> ids = new ArrayList<>();
        for (ExamPartConfig part : TelcB1ProfileFactory.request().config().parts()) {
            for (int i = 0; i < perPart; i++) {
                ExamTaskType type = switch (part.section()) {
                    case SPRACHBAUSTEINE -> part.teil() == 2 ? ExamTaskType.WORD_BANK_CLOZE : ExamTaskType.MULTIPLE_CHOICE;
                    case SCHRIFTLICHER_AUSDRUCK -> ExamTaskType.WRITING_TASK;
                    case MUENDLICHER_AUSDRUCK -> ExamTaskType.TOPIC_INTERVIEW;
                    default -> ExamTaskType.MULTIPLE_CHOICE;
                };
                int questions = part.questionCount() != null ? part.questionCount() : 0;
                ids.add(repository.save(pooledExercise(part.key() + "-" + i, part.section(), part.teil(), type, questions, level)).getId());
            }
        }
        return ids;
    }
}
