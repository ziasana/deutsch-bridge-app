package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.exception.UserVerificationException;
import com.deutschbridge.backend.model.dto.UserDto;
import com.deutschbridge.backend.model.dto.UserRegistrationRequest;
import com.deutschbridge.backend.model.dto.VocabularyRequest;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserProfile;
import com.deutschbridge.backend.model.entity.Vocabulary;
import com.deutschbridge.backend.model.entity.VocabularyContent;
import com.deutschbridge.backend.repository.VocabularyContentRepository;
import com.deutschbridge.backend.repository.VocabularyRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

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

        VocabularyContent contentExists = vocabularyContentRepository.findVocabularyContentByVocabularyAndLanguage(
               vocabulary, request.language());
        if(contentExists!=null)
        {
            throw new IllegalArgumentException("Vocabulary already exists!");
        }
        VocabularyContent newVocabularyContent = new VocabularyContent(
                vocabulary,request.meaning(), request.language()
        );
        vocabularyContentRepository.save(newVocabularyContent);
    }

    public void update(VocabularyRequest request) throws UsernameNotFoundException {
        Vocabulary vocabulary = vocabularyRepository.findByWord(request.word());
        if (vocabulary != null) {
            if(request.synonyms() != null) vocabulary.setSynonyms(request.synonyms());
            if(request.example() != null) vocabulary.setExample(request.example());
            vocabularyRepository.save(vocabulary);

            VocabularyContent vocabularyContent = vocabularyContentRepository.findVocabularyContentByVocabularyAndLanguage(
                    vocabulary,request.language());
            if(request.meaning() != null)  vocabularyContent.setMeaning(request.meaning());
            vocabularyContentRepository.save(vocabularyContent);
        }
    }

    public void delete(VocabularyRequest request) throws UsernameNotFoundException, DataNotFoundException {
        Vocabulary vocabulary = vocabularyRepository.findByWord(request.word());
        if (vocabulary != null) {
            VocabularyContent vocabularyContent = vocabularyContentRepository.findVocabularyContentByVocabularyAndLanguage(
                    vocabulary,request.language());
            if (vocabularyContent!=null) {
                vocabularyContentRepository.delete(vocabularyContent);
            }
            if(vocabularyContentRepository.findVocabularyContentsByVocabulary(vocabulary) == null)
              vocabularyRepository.delete(vocabulary);
        }
        else throw new DataNotFoundException("Vocabulary not exists!");
    }
}
