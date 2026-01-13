package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.VocabularyPracticeRequest;
import com.deutschbridge.backend.model.dto.VocabularyPracticeResponse;
import com.deutschbridge.backend.model.dto.VocabularyResponse;
import com.deutschbridge.backend.model.entity.UserVocabularyPractice;
import com.deutschbridge.backend.model.entity.Vocabulary;
import com.deutschbridge.backend.repository.UserVocabularyPracticeRepository;
import com.deutschbridge.backend.util.VocabularyMapper;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class VocabularyPracticeService {

    private final VocabularyService vocabularyService;
    private final UserService userService;
    private final UserVocabularyPracticeRepository userVocabularyPracticeRepository;
    private final RequestContext requestContext;


    public VocabularyPracticeService( VocabularyService vocabularyService, UserService userService, UserVocabularyPracticeRepository userVocabularyPracticeRepository, RequestContext requestContext) {
        this.vocabularyService = vocabularyService;
        this.userService = userService;
        this.userVocabularyPracticeRepository = userVocabularyPracticeRepository;
        this.requestContext = requestContext;
    }

    public List<VocabularyResponse> getUserWithPractice() {
        if(!userService.existsByEmail(requestContext.getUserEmail()))
            throw new UsernameNotFoundException("User not found");
        List<Vocabulary> vocabulary = vocabularyService.getVocabularyByUserAndLanguage(
                requestContext.getUserId(),requestContext.getLanguage()
        );
        return vocabulary.stream().map(VocabularyMapper::mapToVocabularyResponse).toList();
    }


    public void save(VocabularyPracticeRequest request) throws DataNotFoundException {
        if (!userService.existsByEmail(requestContext.getUserEmail())) {
            throw new UsernameNotFoundException("User not found");
        }

        Vocabulary vocabulary = vocabularyService.findById(request.vocabularyId());

        UserVocabularyPractice practice =
                userVocabularyPracticeRepository.findByVocabularyId(request.vocabularyId())
                        .orElseGet(() -> createNewPractice(vocabulary));
        updateCounters(practice, request);
        userVocabularyPracticeRepository.save(practice);
    }

    private UserVocabularyPractice createNewPractice(Vocabulary vocabulary) {
        UserVocabularyPractice practice = new UserVocabularyPractice();
        practice.setUserId(requestContext.getUserId());
        practice.setVocabulary(vocabulary);
        practice.setKnownCount(0);
        practice.setUnknownCount(0);
        practice.setSuccessRate(0);
        practice.setLastPracticedAt(LocalDate.now());
        return practice;
    }

    private void updateCounters(UserVocabularyPractice practice, VocabularyPracticeRequest request) {

        if (request.known()) {
            practice.setKnownCount(practice.getKnownCount() + 1);
            practice.setSuccessRate(practice.getSuccessRate() + 10 );
        } else {
            practice.setUnknownCount(practice.getUnknownCount() + 1);
        }

        practice.setLastPracticedAt(LocalDate.now());
    }

    public List<VocabularyPracticeResponse> getVocabularyForPractice() {
        if(!userService.existsByEmail(requestContext.getUserEmail()))
            throw new UsernameNotFoundException("User not found");
        List<Vocabulary> vocabulary = vocabularyService.getVocabularyByUserAndLanguage(
                requestContext.getUserId(),requestContext.getLanguage()
        );
        return vocabulary.stream()
                .filter(v ->
                        v.getPractices().isEmpty() ||
                                v.getPractices().stream().anyMatch(p -> p.getSuccessRate() < 100)
                )
                .map(VocabularyMapper::mapVocabularyPracticeResponse)
                .toList();
    }
}
