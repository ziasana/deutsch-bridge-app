package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.AdminRedemittelFunctionDto;
import com.deutschbridge.backend.model.entity.RedemittelFunction;
import com.deutschbridge.backend.repository.RedemittelFunctionRepository;
import com.deutschbridge.backend.repository.WritingPhraseRepository;
import com.deutschbridge.backend.service.cache.RedemittelCacheService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/** Admin CRUD for the "Funktion" (communicative function) a Redemittel belongs to. */
@Service
public class RedemittelFunctionAdminService {

    private final RedemittelFunctionRepository functionRepository;
    private final WritingPhraseRepository phraseRepository;

    public RedemittelFunctionAdminService(RedemittelFunctionRepository functionRepository, WritingPhraseRepository phraseRepository) {
        this.functionRepository = functionRepository;
        this.phraseRepository = phraseRepository;
    }

    public List<AdminRedemittelFunctionDto> list() {
        return functionRepository.findAllByOrderBySortOrderAscLabelAsc().stream().map(this::toDto).toList();
    }

    @CacheEvict(cacheNames = {RedemittelCacheService.PHRASE_CACHE, RedemittelCacheService.LIST_CACHE, RedemittelCacheService.HUB_CACHE,
            RedemittelCacheService.FUNCTION_CACHE}, allEntries = true)
    public AdminRedemittelFunctionDto create(AdminRedemittelFunctionDto dto) {
        String label = requireLabel(dto);
        if (functionRepository.existsByLabelIgnoreCase(label)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A function with this name already exists.");
        }
        RedemittelFunction f = new RedemittelFunction();
        f.setLabel(label);
        f.setSortOrder(dto.sortOrder());
        return toDto(functionRepository.save(f));
    }

    @CacheEvict(cacheNames = {RedemittelCacheService.PHRASE_CACHE, RedemittelCacheService.LIST_CACHE, RedemittelCacheService.HUB_CACHE,
            RedemittelCacheService.FUNCTION_CACHE}, allEntries = true)
    public AdminRedemittelFunctionDto update(String id, AdminRedemittelFunctionDto dto) throws DataNotFoundException {
        RedemittelFunction f = functionRepository.findById(id).orElseThrow(() -> new DataNotFoundException("Function not found!"));
        String label = requireLabel(dto);
        if (functionRepository.existsByLabelIgnoreCaseAndIdNot(label, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A function with this name already exists.");
        }
        f.setLabel(label);
        f.setSortOrder(dto.sortOrder());
        return toDto(functionRepository.save(f));
    }

    /** A function that still has Redemittel cannot be deleted: they would be left without one. */
    @CacheEvict(cacheNames = {RedemittelCacheService.PHRASE_CACHE, RedemittelCacheService.LIST_CACHE, RedemittelCacheService.HUB_CACHE,
            RedemittelCacheService.FUNCTION_CACHE}, allEntries = true)
    public void delete(String id) throws DataNotFoundException {
        if (!functionRepository.existsById(id)) throw new DataNotFoundException("Function not found!");
        long inUse = phraseRepository.countByCategoryId(id);
        if (inUse > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This function is used by " + inUse + " Redemittel. Move or delete them first.");
        }
        functionRepository.deleteById(id);
    }

    private static String requireLabel(AdminRedemittelFunctionDto dto) {
        if (dto.label() == null || dto.label().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required.");
        }
        return dto.label().strip();
    }

    private AdminRedemittelFunctionDto toDto(RedemittelFunction f) {
        return new AdminRedemittelFunctionDto(f.getId(), f.getLabel(), f.getSortOrder(), phraseRepository.countByCategoryId(f.getId()));
    }
}
