package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.VocabularyRequest;
import com.deutschbridge.backend.model.dto.VocabularyResponse;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.Vocabulary;
import com.deutschbridge.backend.model.entity.VocabularyContent;
import com.deutschbridge.backend.repository.VocabularyContentRepository;
import com.deutschbridge.backend.repository.VocabularyRepository;
import com.deutschbridge.backend.util.VocabularyMapper;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VocabularyService {

    private final VocabularyRepository vocabularyRepository;
    private final RequestContext requestContext; // inject per-request
    private final OllamaService ollamaService;
    static final String NOT_FOUND= "Vocabulary not found!";

    private final UserService userService;
    private final VocabularyContentRepository vocabularyContentRepository;

    public VocabularyService(VocabularyRepository vocabularyRepository, RequestContext requestContext, OllamaService ollamaService, UserService userService, VocabularyContentRepository vocabularyContentRepository) {
        this.vocabularyRepository = vocabularyRepository;
        this.requestContext = requestContext;
        this.ollamaService = ollamaService;
        this.userService = userService;
        this.vocabularyContentRepository = vocabularyContentRepository;
    }

    public List<VocabularyResponse> findAll()
    {
        List<Vocabulary> vocabularies = vocabularyRepository.findAll();
             return    vocabularies.stream().
                        map(VocabularyMapper::mapToVocabularyResponse).toList();
    }

    public Vocabulary findById(String id) throws DataNotFoundException {
        return vocabularyRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException("Vocabulary not found"));
    }

    public List<Vocabulary> getVocabularyByUserAndLanguage(String userId, String language) {
        return vocabularyRepository.getVocabularyByUserAndLanguage(userId, language);
    }

    public List<VocabularyResponse> getUserVocabularies() {
        if(!userService.existsByEmail(requestContext.getUserEmail()))
            throw new UsernameNotFoundException("User not found");
        List<Vocabulary> vocabularies= vocabularyRepository.getVocabularyByUserAndLanguage(requestContext.getUserId(), requestContext.getLanguage());
        return vocabularies.stream()
               .map(VocabularyMapper::mapToVocabularyResponse)
               .toList();
    }

    public void save(VocabularyRequest request) throws UsernameNotFoundException {
        User user = userService.findByEmail(requestContext.getUserEmail());
        String synonyms = ollamaService.generateAiSynonyms(request.word());
        Vocabulary vocabulary = vocabularyRepository.findByWord(request.word());
        if (vocabulary == null) {
            Vocabulary newVocabulary = new Vocabulary(
                    request.word(), request.example(), synonyms, user
            );
            vocabularyRepository.save(newVocabulary);

            VocabularyContent vocabularyContent = new VocabularyContent(
                    newVocabulary,request.meaning(),requestContext.getLanguage()
            );
            vocabularyContentRepository.save(vocabularyContent);
            return;
        }

        VocabularyContent contentExists = vocabularyContentRepository.findVocabularyContentByVocabularyIdAndLanguage(
               vocabulary.getId(), requestContext.getLanguage());
        if(contentExists!=null)
        {
            throw new IllegalArgumentException("Vocabulary already exists!");
        }
        VocabularyContent newVocabularyContent = new VocabularyContent(
                vocabulary,request.meaning(), requestContext.getLanguage()
        );
        vocabularyContentRepository.save(newVocabularyContent);
    }

    public VocabularyResponse update(VocabularyRequest request) {
        Vocabulary vocabulary = vocabularyRepository.getVocabularyById(request.id());
        if (vocabulary!=null) {
            if(request.word() != null) vocabulary.setWord(request.word());
            if(request.synonyms() != null) vocabulary.setSynonyms(request.synonyms());
            if(request.example() != null) vocabulary.setExample(request.example());
            vocabularyRepository.save(vocabulary);
            VocabularyContent vocabularyContent = vocabularyContentRepository.findVocabularyContentByVocabularyIdAndLanguage(
                    request.id(), requestContext.getLanguage());
            if(request.meaning() != null)  vocabularyContent.setMeaning(request.meaning());
            vocabularyContentRepository.save(vocabularyContent);

            Vocabulary updated = vocabularyRepository.getVocabularyById(request.id());

            return VocabularyMapper.mapToVocabularyResponse(updated);
        }
        return null;
    }

    public void delete(VocabularyRequest request) throws DataNotFoundException {
        Vocabulary vocabulary = vocabularyRepository.getVocabularyById(request.id());
        if (vocabulary != null) {
            VocabularyContent vocabularyContent = vocabularyContentRepository.findVocabularyContentByVocabularyIdAndLanguage(
                    vocabulary.getId(), requestContext.getLanguage());
            if (vocabularyContent!=null) {
                vocabularyContentRepository.delete(vocabularyContent);
            }
            if(vocabularyContentRepository.findVocabularyContentsByVocabulary(vocabulary) == null)
              vocabularyRepository.delete(vocabulary);
        }
        else throw new DataNotFoundException(NOT_FOUND);
    }
}
