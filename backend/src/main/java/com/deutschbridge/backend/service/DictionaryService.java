package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.model.dto.DictionaryEntryResponse;
import com.deutschbridge.backend.model.dto.ExampleResponse;
import com.deutschbridge.backend.model.dto.SenseResponse;
import com.deutschbridge.backend.model.entity.DictionaryEntry;
import com.deutschbridge.backend.model.entity.DictionaryMissingReport;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.repository.DictionaryEntryRepository;
import com.deutschbridge.backend.repository.DictionaryMissingReportRepository;
import com.deutschbridge.backend.repository.VocabularyItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Runtime lookup flow for the click-to-define dictionary panel (spec section B). The DB is the
 * only source at read time - entries are populated ahead of time by the offline bundled-dataset
 * importer (scripts/dictionary-import), not generated on the fly, so a miss here is a genuine gap
 * in the bundled dataset rather than a slow path.
 *
 * Saving a looked-up word into the user's vocabulary now goes through
 * VocabularyController#addFromDictionary / VocabularyService#addFromDictionary (unified with
 * custom words as a VocabularyItem) instead of this service's own save/remove/list methods.
 */
@Service
public class DictionaryService {

    private final DictionaryEntryRepository dictionaryEntryRepository;
    private final VocabularyItemRepository vocabularyItemRepository;
    private final DictionaryMissingReportRepository missingReportRepository;
    private final UserService userService;
    private final RequestContext requestContext;

    public DictionaryService(DictionaryEntryRepository dictionaryEntryRepository,
                              VocabularyItemRepository vocabularyItemRepository,
                              DictionaryMissingReportRepository missingReportRepository,
                              UserService userService,
                              RequestContext requestContext) {
        this.dictionaryEntryRepository = dictionaryEntryRepository;
        this.vocabularyItemRepository = vocabularyItemRepository;
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

    private boolean isSaved(User user, DictionaryEntry entry) {
        return vocabularyItemRepository.existsByUserAndDictionaryEntry(user, entry);
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
}
