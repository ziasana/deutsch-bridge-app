package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.NomenVerbConnectionResponse;
import com.deutschbridge.backend.model.entity.*;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.NomenVerbConnectionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NomenVerbConnectionServiceTest {

    @Mock private NomenVerbConnectionRepository nomenVerbConnectionRepository;

    @InjectMocks
    private NomenVerbConnectionService nomenVerbConnectionService;
    NomenVerbConnection nomenVerbConnection;
    private LearningProgress learningProgress;

    @BeforeEach
    void setup() {
        nomenVerbConnection= new NomenVerbConnection();
        nomenVerbConnection.setId("123");
        nomenVerbConnection.setWord("eine Entscheidung treffen");
        nomenVerbConnection.setExplanation("to make a decision");
        nomenVerbConnection.setExample("Ich treffe eine Entscheidung.");
        nomenVerbConnection.setLevel(LearningLevel.valueOf("A2"));
        nomenVerbConnection.setTags("business");

        learningProgress = new LearningProgress();
        learningProgress.setId("123");
        learningProgress.setNomenVerb(nomenVerbConnection);
    }

    // ---------------------------------------------------------------
    // findAll
    // ---------------------------------------------------------------
    @Test
    @DisplayName("findAll -> should return mapped responses")
    void findAll_shouldReturnMappedResponses() {
        // given

        Set<LearningProgress> progresses = new HashSet<>();
        progresses.add(learningProgress);

        nomenVerbConnection.setLearningProgresses(progresses);

        when(nomenVerbConnectionRepository.findAll())
                .thenReturn(List.of(nomenVerbConnection));

        // when
        List<NomenVerbConnectionResponse> result =
                nomenVerbConnectionService.findAll();

        // then
        assertEquals(1, result.size());
        assertEquals("eine Entscheidung treffen", result.get(0).word());

        verify(nomenVerbConnectionRepository).findAll();
    }





    // ---------------------------------------------------------------
    // save
    // ---------------------------------------------------------------
    @Test
    @DisplayName("save -> should save a new nomen verb connection")
    void testSave_ShouldSaveNomenVerbConnection() {

        nomenVerbConnectionService.save(nomenVerbConnection);
        verify(nomenVerbConnectionRepository, times(1)).save(any());
    }

    // ---------------------------------------------------------------
    // saveAll
    // ---------------------------------------------------------------
    @Test
    @DisplayName("save -> should save new nomen verb connections")
    void testSaveAll_ShouldSaveAllNomenVerbConnection() {

        nomenVerbConnectionService.saveAll(List.of(nomenVerbConnection));
        verify(nomenVerbConnectionRepository, times(1)).saveAll(any());
    }

    // ---------------------------------------------------------------
    // findById
    // ---------------------------------------------------------------
    @Test
    @DisplayName("find -> should throw an exception")
    void testFindById_ShouldThrowException() {

        when(nomenVerbConnectionRepository.findById(anyString())).thenReturn(Optional.empty());
        assertThrows(DataNotFoundException.class, () -> nomenVerbConnectionService.findById(anyString()));
    }

    @Test
    @DisplayName("find -> should return a nomen verb connection")
    void testFindById_ShouldReturnNomenVerbConnection() throws DataNotFoundException {

        when(nomenVerbConnectionRepository.findById(anyString())).thenReturn(Optional.ofNullable(nomenVerbConnection));
        NomenVerbConnection result = nomenVerbConnectionService.findById("123");
        assertEquals("123", result.getId() );
        assertEquals("eine Entscheidung treffen", result.getWord());
    }

    // ---------------------------------------------------------------
    // update
    // ---------------------------------------------------------------
    @Test
    @DisplayName("update -> should update nomen verb connection")
    void testUpdate_ShouldUpdateVocabulary() throws DataNotFoundException {
        NomenVerbConnection update = new NomenVerbConnection();
        update.setId("123");
        update.setWord("eine Entscheidung treffen");
        update.setExplanation("to make a decision");
        update.setExample("Ich treffe eine Entscheidung.");
        update.setLevel(LearningLevel.valueOf("A2"));
        update.setTags("business");

        when(nomenVerbConnectionRepository.findById("123")).thenReturn(Optional.of(nomenVerbConnection));
        // mock repository save to return the object being saved
        when(nomenVerbConnectionRepository.save(any()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        NomenVerbConnection result = nomenVerbConnectionService.update(update, "123");
        assertEquals("123", result.getId());
        assertEquals("Ich treffe eine Entscheidung.", result.getExample());
        verify(nomenVerbConnectionRepository, times(1)).save(any());
    }


    // ---------------------------------------------------------------
    // delete
    // ---------------------------------------------------------------
    @Test
    @DisplayName("delete -> should delete nomen verb connection")
    void testDelete_ShouldDeleteNomenVerbConnection() throws DataNotFoundException {

        when(nomenVerbConnectionRepository.findById("123")).thenReturn(Optional.ofNullable(nomenVerbConnection));
        nomenVerbConnectionService.deleteById("123");
        verify(nomenVerbConnectionRepository, times(1)).deleteById(any());
    }

    @Test
    @DisplayName("delete -> should throw DataNotFoundException (when nomen verb connection not found)")
    void testDelete_ShouldThrowException_WhenNomenVerbConnectionNotFound()  {

        when(nomenVerbConnectionRepository.findById(anyString())).thenReturn(Optional.empty());

        assertThrows(DataNotFoundException.class, () -> nomenVerbConnectionService.deleteById("123"));
        verify(nomenVerbConnectionRepository, never()).deleteById(any());
    }

}