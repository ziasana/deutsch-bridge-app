package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.DictionaryEntryResponse;
import com.deutschbridge.backend.model.dto.UserVocabResponse;
import com.deutschbridge.backend.model.entity.DictionaryEntry;
import com.deutschbridge.backend.model.entity.Example;
import com.deutschbridge.backend.model.entity.Sense;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserVocab;
import com.deutschbridge.backend.repository.DictionaryEntryRepository;
import com.deutschbridge.backend.repository.DictionaryMissingReportRepository;
import com.deutschbridge.backend.repository.UserVocabRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DictionaryServiceTest {

    @Mock
    private DictionaryEntryRepository dictionaryEntryRepository;

    @Mock
    private UserVocabRepository userVocabRepository;

    @Mock
    private DictionaryMissingReportRepository missingReportRepository;

    @Mock
    private UserService userService;

    @Mock
    private RequestContext requestContext;

    @InjectMocks
    private DictionaryService service;

    private User createUser() {
        User user = new User();
        user.setId("u1");
        user.setEmail("test@mail.com");
        return user;
    }

    private DictionaryEntry createEntry() {
        DictionaryEntry entry = new DictionaryEntry();
        entry.setId("entry1");
        entry.setLemma("haus");
        entry.setIpa("haʊ̯s");
        entry.setArticle("das");

        Sense sense = new Sense();
        sense.setId("sense1");
        sense.setPos("Noun");
        sense.setTranslations(List.of("house", "home"));

        Example example = new Example();
        example.setId("ex1");
        example.setDe("Das ist mein Haus.");
        example.setEn("This is my house.");
        sense.setExamples(List.of(example));

        entry.setSenses(List.of(sense));
        return entry;
    }

    // ---------------------------------------------------------------
    // lookup
    // ---------------------------------------------------------------
    @Test
    @DisplayName("lookup -> should normalize the lemma and return a mapped entry with saved=false when not saved")
    void lookup_shouldReturnMappedEntry() {
        User user = createUser();
        DictionaryEntry entry = createEntry();

        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);
        when(dictionaryEntryRepository.findByLemmaIgnoreCase("Haus")).thenReturn(Optional.of(entry));
        when(userVocabRepository.findByUserAndEntry(user, entry)).thenReturn(Optional.empty());

        Optional<DictionaryEntryResponse> result = service.lookup("  Haus  ");

        assertTrue(result.isPresent());
        DictionaryEntryResponse response = result.get();
        assertEquals("haus", response.lemma());
        assertEquals("das", response.article());
        assertFalse(response.savedByCurrentUser());
        assertEquals(1, response.senses().size());
        assertEquals(List.of("house", "home"), response.senses().get(0).translations());
        assertEquals("Das ist mein Haus.", response.senses().get(0).examples().get(0).de());
    }

    @Test
    @DisplayName("lookup -> should mark savedByCurrentUser true when the user already has it in their vocab")
    void lookup_shouldMarkSavedWhenInUserVocab() {
        User user = createUser();
        DictionaryEntry entry = createEntry();

        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);
        when(dictionaryEntryRepository.findByLemmaIgnoreCase("Haus")).thenReturn(Optional.of(entry));
        when(userVocabRepository.findByUserAndEntry(user, entry)).thenReturn(Optional.of(new UserVocab()));

        Optional<DictionaryEntryResponse> result = service.lookup("Haus");

        assertTrue(result.get().savedByCurrentUser());
    }

    @Test
    @DisplayName("lookup -> should return empty when no entry exists for the lemma")
    void lookup_shouldReturnEmptyWhenNotFound() {
        User user = createUser();
        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);
        when(dictionaryEntryRepository.findByLemmaIgnoreCase("xyzzy")).thenReturn(Optional.empty());

        Optional<DictionaryEntryResponse> result = service.lookup("xyzzy");

        assertTrue(result.isEmpty());
    }

    // ---------------------------------------------------------------
    // reportMissing
    // ---------------------------------------------------------------
    @Test
    @DisplayName("reportMissing -> should persist a trimmed missing-word report for the current user")
    void reportMissing_shouldPersistReport() {
        User user = createUser();
        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);

        service.reportMissing("Schadenfreude ", "not in dictionary");

        var captor = ArgumentCaptor.forClass(com.deutschbridge.backend.model.entity.DictionaryMissingReport.class);
        verify(missingReportRepository).save(captor.capture());
        assertEquals("Schadenfreude", captor.getValue().getLemma());
        assertEquals(user, captor.getValue().getReportedBy());
    }

    // ---------------------------------------------------------------
    // saveToVocab / removeFromVocab
    // ---------------------------------------------------------------
    @Test
    @DisplayName("saveToVocab -> should create a new UserVocab row when none exists")
    void saveToVocab_shouldCreateNewRow() throws DataNotFoundException {
        User user = createUser();
        DictionaryEntry entry = createEntry();

        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);
        when(dictionaryEntryRepository.findById("entry1")).thenReturn(Optional.of(entry));
        when(userVocabRepository.findByUserAndEntry(user, entry)).thenReturn(Optional.empty());
        when(userVocabRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UserVocabResponse response = service.saveToVocab("entry1");

        assertEquals("entry1", response.entryId());
        assertEquals("haus", response.lemma());
        assertEquals("new", response.status());
    }

    @Test
    @DisplayName("saveToVocab -> should not duplicate an existing UserVocab row")
    void saveToVocab_shouldReuseExistingRow() throws DataNotFoundException {
        User user = createUser();
        DictionaryEntry entry = createEntry();
        UserVocab existing = new UserVocab();
        existing.setId("vocab1");
        existing.setUser(user);
        existing.setEntry(entry);
        existing.setStatus("learning");

        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);
        when(dictionaryEntryRepository.findById("entry1")).thenReturn(Optional.of(entry));
        when(userVocabRepository.findByUserAndEntry(user, entry)).thenReturn(Optional.of(existing));
        when(userVocabRepository.save(existing)).thenReturn(existing);

        UserVocabResponse response = service.saveToVocab("entry1");

        assertEquals("vocab1", response.id());
        assertEquals("learning", response.status());
    }

    @Test
    @DisplayName("saveToVocab -> should throw when the dictionary entry doesn't exist")
    void saveToVocab_shouldThrowWhenEntryMissing() {
        User user = createUser();
        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);
        when(dictionaryEntryRepository.findById("missing")).thenReturn(Optional.empty());

        assertThrows(DataNotFoundException.class, () -> service.saveToVocab("missing"));
    }

    @Test
    @DisplayName("removeFromVocab -> should delete the current user's vocab row for the entry")
    void removeFromVocab_shouldDelete() {
        User user = createUser();
        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);

        service.removeFromVocab("entry1");

        verify(userVocabRepository).deleteByUserAndEntry_Id(user, "entry1");
    }
}
