package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.model.dto.WritingLearnProgressDto;
import com.deutschbridge.backend.model.entity.WritingLearnProgress;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.WritingLearnProgressRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/** Stores which "Schreiben lernen" stations the caller finished, so progress follows them across devices. */
@Service
public class WritingLearnProgressService {

    /** Mirrors the station ids of the learning path in the frontend (LEARN_SECTIONS). */
    static final Set<String> STATIONS = Set.of(
            "format", "strategie", "aufbau", "beispiele", "redemittel", "satzbausteine", "fehler", "checkliste");
    static final int MAX_TOTAL = 100;

    private final WritingLearnProgressRepository repository;
    private final RequestContext requestContext;

    public WritingLearnProgressService(WritingLearnProgressRepository repository, RequestContext requestContext) {
        this.repository = repository;
        this.requestContext = requestContext;
    }

    public List<WritingLearnProgressDto> list(LearningLevel level) {
        return repository.findByUserIdAndLevel(requestContext.getUserId(), level.name()).stream()
                .map(p -> new WritingLearnProgressDto(p.getStation(), p.getCorrect(), p.getTotal()))
                .toList();
    }

    /** Upserts a finished station, keeping the better result so repeating a lesson can only improve it. */
    public WritingLearnProgressDto save(LearningLevel level, String station, int correct, int total) {
        if (!STATIONS.contains(station)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown station.");
        }
        if (total < 0 || total > MAX_TOTAL || correct < 0 || correct > total) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid result.");
        }
        String userId = requestContext.getUserId();
        WritingLearnProgress progress = repository.findByUserIdAndLevelAndStation(userId, level.name(), station)
                .orElseGet(() -> {
                    WritingLearnProgress p = new WritingLearnProgress();
                    p.setUserId(userId);
                    p.setLevel(level.name());
                    p.setStation(station);
                    p.setCorrect(-1);
                    p.setTotal(1);
                    return p;
                });
        if (isBetter(correct, total, progress.getCorrect(), progress.getTotal())) {
            progress.setCorrect(correct);
            progress.setTotal(total);
        }
        progress.setCompletedAt(LocalDateTime.now());
        WritingLearnProgress saved = repository.save(progress);
        return new WritingLearnProgressDto(saved.getStation(), saved.getCorrect(), saved.getTotal());
    }

    public void reset(LearningLevel level) {
        repository.deleteByUserIdAndLevel(requestContext.getUserId(), level.name());
    }

    /** Compares correct/total ratios without division (a station without questions counts as 100%). */
    static boolean isBetter(int correct, int total, int oldCorrect, int oldTotal) {
        if (oldCorrect < 0) return true;
        long newScore = total == 0 ? 1000L : (long) correct * 1000 / total;
        long oldScore = oldTotal == 0 ? 1000L : (long) oldCorrect * 1000 / oldTotal;
        return newScore >= oldScore;
    }
}
