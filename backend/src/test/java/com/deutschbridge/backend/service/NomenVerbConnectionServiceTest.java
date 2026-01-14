package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
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

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NomenVerbConnectionServiceTest {

    @Mock private NomenVerbConnectionRepository nomenVerbConnectionRepository;

    @InjectMocks
    private NomenVerbConnectionService nomenVerbConnectionService;

    NomenVerbConnection nomenVerbConnection;

    @BeforeEach
    void setup() {
        nomenVerbConnection = new NomenVerbConnection( "123","zur Verfugung stehen"
                , "example explanation", "ich stehen ihnen zur Verfugung", LearningLevel.A2 ,null);
    }

    // ---------------------------------------------------------------
    // findAll
    // ---------------------------------------------------------------
    @Test
    @DisplayName("findAll -> should return list of nomen verb connections")
    void testFindAll_ShouldReturnListOfNomenVerbConnections() {

        when(nomenVerbConnectionRepository.findAll()).thenReturn(List.of(nomenVerbConnection));

        List<NomenVerbConnection> result = nomenVerbConnectionService.findAll();

        assertNotNull(result);
        assertEquals(nomenVerbConnection.getWord(), result.getFirst().getWord());
        verify(nomenVerbConnectionRepository, times(1)).findAll();
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
        assertEquals("zur Verfugung stehen", result.getWord());

    }

    // ---------------------------------------------------------------
    // update
    // ---------------------------------------------------------------
    @Test
    @DisplayName("update -> should update nomen verb connection")
    void testUpdate_ShouldUpdateVocabulary() throws DataNotFoundException {
      NomenVerbConnection  update = new NomenVerbConnection( "123","zur Verfugung stehen"
                , "example explanation", "ich stehen zur Verfugung", LearningLevel.B2 ,null);

        when(nomenVerbConnectionRepository.findById("123")).thenReturn(Optional.of(nomenVerbConnection));
        // mock repository save to return the object being saved
        when(nomenVerbConnectionRepository.save(any()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        NomenVerbConnection result = nomenVerbConnectionService.update(update, "123");
        assertEquals("123", result.getId());
        assertEquals("ich stehen zur Verfugung", result.getExample());
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