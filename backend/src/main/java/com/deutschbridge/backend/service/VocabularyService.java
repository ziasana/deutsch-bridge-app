package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.VocabularyContentResponse;
import com.deutschbridge.backend.model.dto.VocabularyRequest;
import com.deutschbridge.backend.model.dto.VocabularyResponse;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.Vocabulary;
import com.deutschbridge.backend.model.entity.VocabularyContent;
import com.deutschbridge.backend.repository.VocabularyContentRepository;
import com.deutschbridge.backend.repository.VocabularyRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VocabularyService {

    private final VocabularyRepository vocabularyRepository;

    static final String NOT_FOUND= "Vocabulary not found!";
    private final UserService userService;
    private final VocabularyContentRepository vocabularyContentRepository;

    public VocabularyService(VocabularyRepository vocabularyRepository, UserService userService, VocabularyContentRepository vocabularyContentRepository) {
        this.vocabularyRepository = vocabularyRepository;
        this.userService = userService;
        this.vocabularyContentRepository = vocabularyContentRepository;
    }

    public List<Vocabulary> findAll()
    {
        return vocabularyRepository.findAll();
    }

    @SuppressWarnings("java:S5804")
    public List<VocabularyResponse> getUserVocabularies(String email,String language) {
        User user = userService.findByEmail(email);
        if(user == null) {
            throw new UsernameNotFoundException(NOT_FOUND);
        }
      List<Vocabulary> vocabularies= vocabularyRepository.getVocabularyByUserAndLanguage(user.getId(), language);
       return vocabularies.stream().map(
                v ->  new VocabularyResponse(
                        v.getId(),
                        v.getWord(),
                        v.getExample(),
                        v.getSynonyms(),
                        v.getUser().getEmail(),
                        v.getVocabularyContents().stream()
                                .map(c -> new VocabularyContentResponse(
                                        c.getLanguage(),
                                        c.getMeaning())
                                ).toList()

                )
        )
               .toList();

    }

    @SuppressWarnings("java:S5804")
    public void save(VocabularyRequest request) throws UsernameNotFoundException {

        User user = userService.findByEmail(request.userEmail());
        if (user == null)
            throw new UsernameNotFoundException(NOT_FOUND);

        Vocabulary vocabulary = vocabularyRepository.findByWord(request.word());
        if (vocabulary == null) {
            Vocabulary newVocabulary = new Vocabulary(
                    request.word(), request.example(), request.synonyms(), user
            );
            vocabularyRepository.save(newVocabulary);

            VocabularyContent vocabularyContent = new VocabularyContent(
                    newVocabulary,request.meaning(), request.language()
            );
            vocabularyContentRepository.save(vocabularyContent);
            return;
        }

        VocabularyContent contentExists = vocabularyContentRepository.findVocabularyContentByVocabularyIdAndLanguage(
               vocabulary.getId(), request.language());
        if(contentExists!=null)
        {
            throw new IllegalArgumentException("Vocabulary already exists!");
        }
        VocabularyContent newVocabularyContent = new VocabularyContent(
                vocabulary,request.meaning(), request.language()
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
                    request.id(), request.language());
            if(request.meaning() != null)  vocabularyContent.setMeaning(request.meaning());
            vocabularyContentRepository.save(vocabularyContent);

            Vocabulary updated = vocabularyRepository.getVocabularyById(request.id());

            return new VocabularyResponse(
                    updated.getId(),
                    updated.getWord(),
                    updated.getExample(),
                    updated.getSynonyms(),
                    updated.getUser().getEmail(),
                    updated.getVocabularyContents().stream()
                            .map(c -> new VocabularyContentResponse(
                                    c.getLanguage(),
                                    c.getMeaning()
                            )).toList()
            );
        }
        return null;
    }

    public void delete(VocabularyRequest request) throws DataNotFoundException {
        Vocabulary vocabulary = vocabularyRepository.getVocabularyById(request.id());
        if (vocabulary != null) {
            VocabularyContent vocabularyContent = vocabularyContentRepository.findVocabularyContentByVocabularyIdAndLanguage(
                    vocabulary.getId(),request.language());
            if (vocabularyContent!=null) {
                vocabularyContentRepository.delete(vocabularyContent);
            }
            if(vocabularyContentRepository.findVocabularyContentsByVocabulary(vocabulary) == null)
              vocabularyRepository.delete(vocabulary);
        }
        else throw new DataNotFoundException(NOT_FOUND);
    }
}
