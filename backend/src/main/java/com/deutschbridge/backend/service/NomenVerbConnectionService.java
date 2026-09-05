package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.NomenVerbConnectionResponse;
import com.deutschbridge.backend.model.entity.LearningProgress;
import com.deutschbridge.backend.model.entity.NomenVerbConnection;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.repository.LearningProgressRepository;
import com.deutschbridge.backend.repository.NomenVerbConnectionRepository;
import com.deutschbridge.backend.util.NomenVerbConnectionMapper;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class NomenVerbConnectionService {

    private final NomenVerbConnectionRepository nomenVerbConnectionRepository;
    private final LearningProgressRepository learningProgressRepository;
    private final UserService userService;
    private final RequestContext requestContext;
    private static final String NOT_FOUND_MSG= "Nomen-verb-verbindung not found!";
    private static final String CACHE_NAME = "nomenVerb";

    public NomenVerbConnectionService(NomenVerbConnectionRepository nomenVerbConnectionRepository,
                                       LearningProgressRepository learningProgressRepository,
                                       UserService userService,
                                       RequestContext requestContext) {
        this.nomenVerbConnectionRepository = nomenVerbConnectionRepository;
        this.learningProgressRepository = learningProgressRepository;
        this.userService = userService;
        this.requestContext = requestContext;
    }

    // Not cached: the response is scoped to the current user's learning
    // progress, so a shared 'all' cache key would leak one user's progress
    // to every other user reading it.
    public List<NomenVerbConnectionResponse> findAll() {
        return mapWithCurrentUserProgress(nomenVerbConnectionRepository.findAll());
    }

    @CachePut (cacheNames = CACHE_NAME, key = "#result.id")
    public NomenVerbConnection save(NomenVerbConnection word) {
        return nomenVerbConnectionRepository.save(word);
    }

    @Cacheable(cacheNames = CACHE_NAME, key = "'all'")
    public List<NomenVerbConnection> saveAll(List<NomenVerbConnection> list) {
        return nomenVerbConnectionRepository.saveAll(list);
    }

    @Cacheable(cacheNames = CACHE_NAME, key = "#id")
    public NomenVerbConnection findById(String id) throws DataNotFoundException {
        return nomenVerbConnectionRepository.findById(id)
                .orElseThrow(()->new DataNotFoundException(NOT_FOUND_MSG));
    }

    @CacheEvict(cacheNames = CACHE_NAME, key = "#id")
    public boolean deleteById(String  id) throws DataNotFoundException {
        nomenVerbConnectionRepository.findById(id)
                .orElseThrow(()->new DataNotFoundException(NOT_FOUND_MSG));
        nomenVerbConnectionRepository.deleteById(id);
        return true;
    }

    @CachePut(cacheNames = CACHE_NAME, key = "#result.id")
    public NomenVerbConnection update(NomenVerbConnection word, String id) throws DataNotFoundException {
        NomenVerbConnection existing = nomenVerbConnectionRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
        if (existing.getWord() != null) existing.setWord(word.getWord());
        if (existing.getExplanation() != null) existing.setExplanation(word.getExplanation());
        if (existing.getExample() != null) existing.setExample(word.getExample());
        if (existing.getLevel() != null) existing.setLevel(word.getLevel());
        if (existing.getTags() != null) existing.setTags(word.getTags());
       return nomenVerbConnectionRepository.save(existing);
    }

    public List<NomenVerbConnectionResponse> getWithLearningProgress() {
        return mapWithCurrentUserProgress(nomenVerbConnectionRepository.getWithLearningProgress());
    }

    private List<NomenVerbConnectionResponse> mapWithCurrentUserProgress(List<NomenVerbConnection> connections) {
        if (connections.isEmpty()) return List.of();

        User user = userService.findByEmail(requestContext.getUserEmail());
        List<LearningProgress> progresses = learningProgressRepository.findByUserAndNomenVerbIn(user, connections);
        Map<String, LearningProgress> progressByConnectionId = progresses.stream()
                .collect(Collectors.toMap(p -> p.getNomenVerb().getId(), p -> p, (first, second) -> first));

        return connections.stream()
                .map(c -> NomenVerbConnectionMapper.mapToNomenVerbConnectionResponse(c, progressByConnectionId.get(c.getId())))
                .toList();
    }
}
