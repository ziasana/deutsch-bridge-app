package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.DictionaryEntryResponse;
import com.deutschbridge.backend.model.dto.ExampleResponse;
import com.deutschbridge.backend.model.dto.SenseResponse;
import com.deutschbridge.backend.model.dto.UserVocabResponse;
import com.deutschbridge.backend.model.entity.DictionaryEntry;
import com.deutschbridge.backend.model.entity.DictionaryMissingReport;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserVocab;
import com.deutschbridge.backend.repository.DictionaryEntryRepository;
import com.deutschbridge.backend.repository.DictionaryMissingReportRepository;
import com.deutschbridge.backend.repository.UserVocabRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Runtime lookup flow for the click-to-define dictionary panel (spec section B). The DB is the
 * only source at read time - entries are populated ahead of time by the offline bundled-dataset
 * importer (scripts/dictionary-import), not generated on the fly, so a miss here is a genuine gap
 * in the bundled dataset rather than a slow path.
 */
@Service
public class DictionaryService {

    private static final String ENTRY_NOT_FOUND_MSG = "Dictionary entry not found!";

    private final DictionaryEntryRepository dictionaryEntryRepository;
    private final UserVocabRepository userVocabRepository;
    private final DictionaryMissingReportRepository missingReportRepository;
    private final UserService userService;
    private final RequestContext requestContext;

    public DictionaryService(DictionaryEntryRepository dictionaryEntryRepository,
                              UserVocabRepository userVocabRepository,
                              DictionaryMissingReportRepository missingReportRepository,
                              UserService userService,
                              RequestContext requestContext) {
        this.dictionaryEntryRepository = dictionaryEntryRepository;
        this.userVocabRepository = userVocabRepository;
        this.missingReportRepository = missingReportRepository;
        this.userService = userService;
        this.requestContext = requestContext;
    }

    public Optional<DictionaryEntryResponse> lookup(String lemma) {
        User user = userService.findByEmail(requestContext.getUserEmail());

        return dictionaryEntryRepository.findByLemmaIgnoreCase(normalize(lemma))
                .map(entry -> toResponse(entry, isSaved(user, entry)));
    }

    public void reportMissing(String lemma, String note) {
        User user = userService.findByEmail(requestContext.getUserEmail());

        DictionaryMissingReport report = new DictionaryMissingReport();
        report.setLemma(normalize(lemma));
        report.setReportedBy(user);
        missingReportRepository.save(report);
    }

    public UserVocabResponse saveToVocab(String entryId) throws DataNotFoundException {
        User user = userService.findByEmail(requestContext.getUserEmail());
        DictionaryEntry entry = dictionaryEntryRepository.findById(entryId)
                .orElseThrow(() -> new DataNotFoundException(ENTRY_NOT_FOUND_MSG));

        UserVocab vocab = userVocabRepository.findByUserAndEntry(user, entry)
                .orElseGet(() -> {
                    UserVocab created = new UserVocab();
                    created.setUser(user);
                    created.setEntry(entry);
                    return created;
                });

        vocab = userVocabRepository.save(vocab);
        return toVocabResponse(vocab);
    }

    @Transactional
    public void removeFromVocab(String entryId) {
        User user = userService.findByEmail(requestContext.getUserEmail());
        userVocabRepository.deleteByUserAndEntry_Id(user, entryId);
    }

    public List<UserVocabResponse> getUserVocab() {
        User user = userService.findByEmail(requestContext.getUserEmail());
        return userVocabRepository.findByUserOrderByAddedAtDesc(user).stream()
                .map(this::toVocabResponse)
                .toList();
    }

    private boolean isSaved(User user, DictionaryEntry entry) {
        return userVocabRepository.findByUserAndEntry(user, entry).isPresent();
    }

    private String normalize(String lemma) {
        return lemma == null ? "" : lemma.trim();
    }

    private DictionaryEntryResponse toResponse(DictionaryEntry entry, boolean saved) {
        List<SenseResponse> senses = entry.getSenses() == null ? List.of() : entry.getSenses().stream()
                .map(sense -> new SenseResponse(
                        sense.getId(),
                        sense.getPos(),
                        sense.getTranslations(),
                        sense.getExamples() == null ? List.of() : sense.getExamples().stream()
                                .map(ex -> new ExampleResponse(ex.getId(), ex.getDe(), ex.getEn(), ex.getAudioUrl()))
                                .toList()
                ))
                .toList();

        return new DictionaryEntryResponse(
                entry.getId(),
                entry.getLemma(),
                entry.getIpa(),
                entry.getAudioUrl(),
                entry.getArticle(),
                senses,
                saved
        );
    }

    private UserVocabResponse toVocabResponse(UserVocab vocab) {
        DictionaryEntry entry = vocab.getEntry();
        String meaning = entry.getSenses() == null || entry.getSenses().isEmpty()
                ? null
                : String.join(", ", entry.getSenses().get(0).getTranslations());

        return new UserVocabResponse(
                vocab.getId(),
                entry.getId(),
                entry.getLemma(),
                entry.getArticle(),
                meaning,
                vocab.getStatus()
        );
    }
}
