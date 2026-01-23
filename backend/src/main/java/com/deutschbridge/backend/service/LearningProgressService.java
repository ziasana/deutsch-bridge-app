package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.LearningProgressRequest;
import com.deutschbridge.backend.model.entity.GrammarLesson;
import com.deutschbridge.backend.model.entity.LearningProgress;
import com.deutschbridge.backend.model.entity.NomenVerbConnection;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.repository.LearningProgressRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;
import java.util.function.Supplier;


@Service
public class LearningProgressService {

    private final LearningProgressRepository repository;
    private final RequestContext requestContext;
    private final UserService userService;
    private final NomenVerbConnectionService nomenVerbConnectionService;
    private final GrammarService grammarService;

    public LearningProgressService(LearningProgressRepository repository, RequestContext requestContext, UserService userService, NomenVerbConnectionService nomenVerbConnectionService, GrammarService grammarService) {
        this.repository = repository;
        this.requestContext = requestContext;
        this.userService = userService;
        this.nomenVerbConnectionService = nomenVerbConnectionService;
        this.grammarService = grammarService;
    }

    public List<LearningProgress> findAll()
    {
        return repository.findAll();
    }

    public Optional<LearningProgress> finById(String id) {
        return repository.findById(id);
    }

    @Transactional
    public void save(LearningProgressRequest request) throws DataNotFoundException {

        User user = userService.findByEmail(requestContext.getUserEmail());
        LocalDateTime now = LocalDateTime.now();

        if (request.lessonId() != null) {
            GrammarLesson lesson = grammarService.findById(request.lessonId());

            saveProgress(
                    () -> repository.findByUserAndLesson(user, lesson),
                    progress -> progress.setLesson(lesson),
                    user,
                    request.learned(),
                    now
            );
        }

        if (request.nomenVerbId() != null) {
            NomenVerbConnection nv =
                    nomenVerbConnectionService.findById(request.nomenVerbId());

            saveProgress(
                    () -> repository.findByUserAndNomenVerb(user, nv),
                    progress -> progress.setNomenVerb(nv),
                    user,
                    request.learned(),
                    now
            );
        }
    }

    private void saveProgress(
            Supplier<Optional<LearningProgress>> finder,
            Consumer<LearningProgress> relationSetter,
            User user,
            boolean learned,
            LocalDateTime now
    ) {
        LearningProgress progress = finder.get()
                .orElseGet(() -> {
                    LearningProgress lp = new LearningProgress();
                    lp.setUser(user);
                    relationSetter.accept(lp);
                    return lp;
                });

        progress.setLearned(learned);
        progress.setLearnedAt(now);

        repository.save(progress);
    }




}
