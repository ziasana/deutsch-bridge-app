package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.model.enums.ExamPartModule;
import com.deutschbridge.backend.model.enums.PartScoringMethod;
import com.deutschbridge.backend.model.examsim.ExamPartConfig;
import com.deutschbridge.backend.model.examsim.PartResult;
import com.deutschbridge.backend.model.examsim.ProfileSnapshot;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/** Scores single parts by delegating to the scorer registered for the part's effective scoring method. */
@Service
public class ExamScoringService {

    private final Map<PartScoringMethod, PartScorer> scorers = new EnumMap<>(PartScoringMethod.class);

    public ExamScoringService(List<PartScorer> scorerBeans) {
        scorerBeans.forEach(s -> scorers.put(s.method(), s));
    }

    /** Oral parts of a profile without oral scoring are never scored, whatever their configured method. */
    public static PartScoringMethod effectiveMethod(ProfileSnapshot profile, ExamPartConfig part) {
        if (part.module() == ExamPartModule.ORAL && !profile.oralScoringEnabled()) return PartScoringMethod.UNSCORED;
        return part.scoringMethod();
    }

    public PartResult scorePart(PartScoringContext context) {
        PartScorer scorer = scorers.get(context.method());
        if (scorer == null) throw new IllegalStateException("No scorer registered for " + context.method());
        return scorer.score(context);
    }
}
