package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.exception.ExamSimulationException;
import com.deutschbridge.backend.model.dto.examsim.ExamProfileRequest;
import com.deutschbridge.backend.model.entity.ExamProfile;
import com.deutschbridge.backend.model.enums.ExamProfileStatus;
import com.deutschbridge.backend.model.examsim.ExamPartConfig;
import com.deutschbridge.backend.service.examsim.ProfileValidationResult.Issue;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Profile lifecycle: DRAFT (editable) -> PUBLISHED (frozen, can start attempts) -> DEACTIVATED -> ARCHIVED.
 * Editing a published profile means duplicating it into a new draft version, so attempts and results always refer to an
 * unchanged version.
 */
@Service
public class ExamProfileService {

    private static final String NOT_FOUND = "Exam profile not found!";

    private final com.deutschbridge.backend.repository.ExamProfileRepository repository;
    private final ExamProfileValidator validator;
    private final ExamPoolService poolService;
    private final ExamSimulationAuditService audit;
    private final Clock clock;

    public ExamProfileService(com.deutschbridge.backend.repository.ExamProfileRepository repository, ExamProfileValidator validator,
                              ExamPoolService poolService, ExamSimulationAuditService audit, Clock clock) {
        this.repository = repository;
        this.validator = validator;
        this.poolService = poolService;
        this.audit = audit;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<ExamProfile> listAll() {
        return repository.findAllByOrderByCodeAscVersionDesc();
    }

    @Transactional(readOnly = true)
    public List<ExamProfile> listPublished() {
        return repository.findByStatusOrderByTitleAscVersionDesc(ExamProfileStatus.PUBLISHED);
    }

    @Transactional(readOnly = true)
    public ExamProfile get(String id) throws DataNotFoundException {
        return repository.findById(id).orElseThrow(() -> new DataNotFoundException(NOT_FOUND));
    }

    @Transactional
    public ExamProfile create(ExamProfileRequest request, String actor) {
        if (request.code() == null || request.code().isBlank()) throw ExamSimulationException.badRequest("CODE_REQUIRED", "Profile code is required.");
        if (repository.existsByCode(request.code())) {
            throw ExamSimulationException.conflict("PROFILE_CODE_EXISTS", "A profile with this code already exists. Duplicate it to create a new version.");
        }
        ExamProfile profile = new ExamProfile();
        profile.setVersion(1);
        apply(profile, request);
        profile.setCode(request.code().trim());
        profile.setStatus(ExamProfileStatus.DRAFT);
        profile.setCreatedAt(Instant.now(clock));
        profile.setCreatedBy(actor);
        profile = repository.save(profile);
        audit.record(ExamSimulationAuditService.PROFILE, profile.getId(), "CREATED", null, profile.getStatus().name(), actor, Map.of("code", profile.getCode(), "version", 1));
        return profile;
    }

    @Transactional
    public ExamProfile update(String id, ExamProfileRequest request, String actor) throws DataNotFoundException {
        ExamProfile profile = lock(id);
        requireEditable(profile);
        apply(profile, request);
        profile.setUpdatedAt(Instant.now(clock));
        profile.setUpdatedBy(actor);
        profile = repository.save(profile);
        audit.record(ExamSimulationAuditService.PROFILE, id, "UPDATED", profile.getStatus().name(), profile.getStatus().name(), actor, null);
        return profile;
    }

    @Transactional
    public ExamProfile duplicate(String id, String actor) throws DataNotFoundException {
        ExamProfile source = get(id);
        ExamProfile copy = new ExamProfile();
        copy.setCode(source.getCode());
        copy.setVersion(repository.maxVersion(source.getCode()) + 1);
        copy.setProvider(source.getProvider());
        copy.setExamName(source.getExamName());
        copy.setTitle(source.getTitle());
        copy.setDescription(source.getDescription());
        copy.setExamType(source.getExamType());
        copy.setLevel(source.getLevel());
        copy.setStatus(ExamProfileStatus.DRAFT);
        copy.setOralScoringEnabled(source.isOralScoringEnabled());
        copy.setWrittenMaxPoints(source.getWrittenMaxPoints());
        copy.setWrittenPassThreshold(source.getWrittenPassThreshold());
        copy.setOralMaxPoints(source.getOralMaxPoints());
        copy.setOralPassThreshold(source.getOralPassThreshold());
        copy.setOverallResultPolicy(source.getOverallResultPolicy());
        copy.setAnswerReleasePolicy(source.getAnswerReleasePolicy());
        copy.setMaxResumes(source.getMaxResumes());
        copy.setExcludePracticedExercises(source.isExcludePracticedExercises());
        copy.setConfig(source.getConfig());
        copy.setSourceProfileId(source.getId());
        copy.setCreatedAt(Instant.now(clock));
        copy.setCreatedBy(actor);
        copy = repository.save(copy);
        audit.record(ExamSimulationAuditService.PROFILE, copy.getId(), "DUPLICATED", null, ExamProfileStatus.DRAFT.name(), actor,
                Map.of("sourceProfileId", source.getId(), "version", copy.getVersion()));
        return copy;
    }

    /** Structural validation plus content-availability checks (every part needs enough eligible published exercises). */
    @Transactional(readOnly = true)
    public ProfileValidationResult validate(String id) throws DataNotFoundException {
        return validateProfile(get(id));
    }

    public ProfileValidationResult validateProfile(ExamProfile profile) {
        ProfileValidationResult structural = validator.validate(profile);
        List<Issue> errors = new ArrayList<>(structural.errors());
        List<Issue> warnings = new ArrayList<>(structural.warnings());
        if (errors.isEmpty()) {
            for (ExamPartConfig part : profile.getConfig().partsOrEmpty()) {
                int eligible = poolService.eligibleExercises(profile, part).size();
                if (eligible < part.effectiveExerciseCount()) {
                    errors.add(new Issue("CONTENT_MISSING", "config.parts." + part.key(), part.label() + ": " + eligible
                            + " eligible published exercise(s), at least " + part.effectiveExerciseCount() + " required."));
                } else if (eligible < part.effectiveExerciseCount() * 3) {
                    warnings.add(new Issue("CONTENT_LOW", "config.parts." + part.key(), part.label() + ": only " + eligible
                            + " eligible exercise(s); learners will exhaust this part quickly."));
                }
            }
        }
        return new ProfileValidationResult(errors, warnings);
    }

    @Transactional
    public ExamProfile publish(String id, String verificationNote, String actor) throws DataNotFoundException {
        ExamProfile profile = lock(id);
        if (profile.getStatus() != ExamProfileStatus.DRAFT && profile.getStatus() != ExamProfileStatus.DEACTIVATED) {
            throw ExamSimulationException.conflict("PROFILE_NOT_PUBLISHABLE", "Only draft or deactivated profiles can be published.");
        }
        String note = verificationNote != null && !verificationNote.isBlank() ? verificationNote.trim() : profile.getVerificationNote();
        if (note == null || note.isBlank()) {
            throw ExamSimulationException.badRequest("VERIFICATION_NOTE_REQUIRED",
                    "Record the official exam documentation this profile was verified against before publishing.");
        }
        ProfileValidationResult result = validateProfile(profile);
        if (!result.isValid()) {
            throw new ExamSimulationException(HttpStatus.UNPROCESSABLE_ENTITY, "PROFILE_INVALID", "The profile is invalid and cannot be published.",
                    Map.of("errors", result.errors(), "warnings", result.warnings()));
        }
        // Only one version of a code is offered to learners at a time; running attempts keep their own snapshot.
        for (ExamProfile other : repository.findAllByOrderByCodeAscVersionDesc()) {
            if (other.getCode().equals(profile.getCode()) && !other.getId().equals(id) && other.getStatus() == ExamProfileStatus.PUBLISHED) {
                other.setStatus(ExamProfileStatus.DEACTIVATED);
                repository.save(other);
                audit.record(ExamSimulationAuditService.PROFILE, other.getId(), "DEACTIVATED_BY_NEWER_VERSION", ExamProfileStatus.PUBLISHED.name(),
                        ExamProfileStatus.DEACTIVATED.name(), actor, Map.of("newVersion", profile.getVersion()));
            }
        }
        String from = profile.getStatus().name();
        profile.setStatus(ExamProfileStatus.PUBLISHED);
        profile.setVerificationNote(note);
        profile.setPublishedAt(Instant.now(clock));
        profile.setPublishedBy(actor);
        profile = repository.save(profile);
        audit.record(ExamSimulationAuditService.PROFILE, id, "PUBLISHED", from, ExamProfileStatus.PUBLISHED.name(), actor, Map.of("verificationNote", note));
        return profile;
    }

    @Transactional
    public ExamProfile deactivate(String id, String actor) throws DataNotFoundException {
        ExamProfile profile = lock(id);
        if (profile.getStatus() != ExamProfileStatus.PUBLISHED) {
            throw ExamSimulationException.conflict("PROFILE_NOT_PUBLISHED", "Only published profiles can be deactivated.");
        }
        return transition(profile, ExamProfileStatus.DEACTIVATED, "DEACTIVATED", actor);
    }

    @Transactional
    public ExamProfile archive(String id, String actor) throws DataNotFoundException {
        ExamProfile profile = lock(id);
        if (profile.getStatus() == ExamProfileStatus.ARCHIVED) return profile;
        return transition(profile, ExamProfileStatus.ARCHIVED, "ARCHIVED", actor);
    }

    private ExamProfile transition(ExamProfile profile, ExamProfileStatus target, String action, String actor) {
        String from = profile.getStatus().name();
        profile.setStatus(target);
        profile.setUpdatedAt(Instant.now(clock));
        profile.setUpdatedBy(actor);
        profile = repository.save(profile);
        audit.record(ExamSimulationAuditService.PROFILE, profile.getId(), action, from, target.name(), actor, null);
        return profile;
    }

    private ExamProfile lock(String id) throws DataNotFoundException {
        return repository.findByIdForUpdate(id).orElseThrow(() -> new DataNotFoundException(NOT_FOUND));
    }

    private void requireEditable(ExamProfile profile) {
        if (!profile.isEditable()) {
            throw ExamSimulationException.conflict("PROFILE_IMMUTABLE", "Only draft profiles can be edited. Duplicate the profile to create a new version.");
        }
    }

    private void apply(ExamProfile p, ExamProfileRequest r) {
        if (r.level() == null || isBlank(r.provider()) || isBlank(r.examName()) || isBlank(r.title()) || r.config() == null
                || r.overallResultPolicy() == null || r.answerReleasePolicy() == null) {
            throw ExamSimulationException.badRequest("PROFILE_INCOMPLETE",
                    "Provider, exam name, title, level, result policies and the part/timer configuration are required.");
        }
        p.setProvider(r.provider());
        p.setExamName(r.examName());
        p.setTitle(r.title());
        p.setDescription(r.description());
        p.setExamType(r.examType() != null ? r.examType() : com.deutschbridge.backend.model.enums.ExamType.TELC);
        p.setLevel(r.level());
        p.setOralScoringEnabled(r.oralScoringEnabled());
        p.setWrittenMaxPoints(orZero(r.writtenMaxPoints()));
        p.setWrittenPassThreshold(orZero(r.writtenPassThreshold()));
        p.setOralMaxPoints(orZero(r.oralMaxPoints()));
        p.setOralPassThreshold(orZero(r.oralPassThreshold()));
        p.setOverallResultPolicy(r.overallResultPolicy());
        p.setAnswerReleasePolicy(r.answerReleasePolicy());
        p.setMaxResumes(r.maxResumes());
        p.setExcludePracticedExercises(r.excludePracticedExercises());
        p.setConfig(r.config());
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private static java.math.BigDecimal orZero(java.math.BigDecimal v) {
        return v != null ? v : java.math.BigDecimal.ZERO;
    }
}
