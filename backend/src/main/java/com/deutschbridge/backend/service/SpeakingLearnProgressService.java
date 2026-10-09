package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.model.dto.SpeakingGuideDtos.LearnProgress;
import com.deutschbridge.backend.model.entity.SpeakingLearnProgress;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.SpeakingLearnProgressRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/** Stores which "Mündlicher Ausdruck lernen" stations the caller finished, so progress follows them across devices. */
@Service
public class SpeakingLearnProgressService {

    /** Mirrors the station ids of the learning path in the frontend (speakingMeta.ts). */
    static final Set<String> STATIONS = Set.of("ablauf", "tipps", "fragen", "redemittel", "fehler", "checkliste");
    static final int PARTS = 3;
    static final int MAX_TOTAL = 100;

    private final SpeakingLearnProgressRepository repository;
    private final RequestContext requestContext;

    public SpeakingLearnProgressService(SpeakingLearnProgressRepository repository, RequestContext requestContext) {
        this.repository = repository;
        this.requestContext = requestContext;
    }

    public List<LearnProgress> list(LearningLevel level) {
        return repository.findByUserIdAndLevel(requestContext.getUserId(), level.name()).stream()
                .map(p -> new LearnProgress(p.getPartNumber(), p.getStation(), p.getCorrect(), p.getTotal()))
                .toList();
    }

    /** Upserts a finished station, keeping the better result so repeating a lesson can only improve it. */
    public LearnProgress save(LearningLevel level, int part, String station, int correct, int total) {
        checkPart(part);
        if (!STATIONS.contains(station)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown station.");
        if (total < 0 || total > MAX_TOTAL || correct < 0 || correct > total) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid result.");
        }
        String userId = requestContext.getUserId();
        SpeakingLearnProgress progress = repository.findByUserIdAndLevelAndPartNumberAndStation(userId, level.name(), part, station)
                .orElseGet(() -> {
                    SpeakingLearnProgress p = new SpeakingLearnProgress();
                    p.setUserId(userId);
                    p.setLevel(level.name());
                    p.setPartNumber(part);
                    p.setStation(station);
                    p.setCorrect(-1);
                    p.setTotal(1);
                    return p;
                });
        if (WritingLearnProgressService.isBetter(correct, total, progress.getCorrect(), progress.getTotal())) {
            progress.setCorrect(correct);
            progress.setTotal(total);
        }
        progress.setCompletedAt(LocalDateTime.now());
        SpeakingLearnProgress saved = repository.save(progress);
        return new LearnProgress(saved.getPartNumber(), saved.getStation(), saved.getCorrect(), saved.getTotal());
    }

    public void reset(LearningLevel level, int part) {
        checkPart(part);
        repository.deleteByUserIdAndLevelAndPartNumber(requestContext.getUserId(), level.name(), part);
    }

    private static void checkPart(int part) {
        if (part < 1 || part > PARTS) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown Teil.");
    }
}
