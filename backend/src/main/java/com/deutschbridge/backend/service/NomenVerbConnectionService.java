package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.entity.NomenVerbConnection;
import com.deutschbridge.backend.repository.NomenVerbConnectionRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NomenVerbConnectionService {

    private final NomenVerbConnectionRepository nomenVerbConnectionRepository;
    private static final String NOT_FOUND_MSG= "Nomen-verb-verbindung not found!";
    private static final String CACHE_NAME = "nomenVerb";
    public NomenVerbConnectionService(NomenVerbConnectionRepository nomenVerbConnectionRepository) {
        this.nomenVerbConnectionRepository = nomenVerbConnectionRepository;
    }

    @Cacheable(cacheNames = CACHE_NAME, key = "'all'")
    public List<NomenVerbConnection> findAll() {
        return nomenVerbConnectionRepository.findAll();
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
}
