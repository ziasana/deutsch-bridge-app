package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.AdminRedemittelFunctionDto;
import com.deutschbridge.backend.model.entity.RedemittelFunction;
import com.deutschbridge.backend.repository.RedemittelFunctionRepository;
import com.deutschbridge.backend.repository.WritingPhraseRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RedemittelFunctionAdminServiceTest {

    @Mock private RedemittelFunctionRepository functionRepository;
    @Mock private WritingPhraseRepository phraseRepository;
    @InjectMocks private RedemittelFunctionAdminService service;

    @Test
    @DisplayName("create -> trims the name and saves; a blank name is rejected")
    void create() {
        when(functionRepository.save(any(RedemittelFunction.class))).thenAnswer(inv -> inv.getArgument(0));
        AdminRedemittelFunctionDto created = service.create(new AdminRedemittelFunctionDto(null, "  Warnen ", 3, 0));
        assertEquals("Warnen", created.label());
        assertEquals(3, created.sortOrder());

        ResponseStatusException blank = assertThrows(ResponseStatusException.class,
                () -> service.create(new AdminRedemittelFunctionDto(null, "  ", 0, 0)));
        assertEquals(HttpStatus.BAD_REQUEST, blank.getStatusCode());
    }

    @Test
    @DisplayName("create -> a duplicate name is a conflict")
    void duplicate() {
        when(functionRepository.existsByLabelIgnoreCase("Bitten")).thenReturn(true);
        ResponseStatusException e = assertThrows(ResponseStatusException.class,
                () -> service.create(new AdminRedemittelFunctionDto(null, "Bitten", 0, 0)));
        assertEquals(HttpStatus.CONFLICT, e.getStatusCode());
        verify(functionRepository, never()).save(any());
    }

    @Test
    @DisplayName("delete -> blocked while Redemittel use the function, allowed otherwise")
    void delete() throws Exception {
        when(functionRepository.existsById("f1")).thenReturn(true);
        when(phraseRepository.countByCategoryId("f1")).thenReturn(2L);
        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> service.delete("f1"));
        assertEquals(HttpStatus.CONFLICT, e.getStatusCode());
        verify(functionRepository, never()).deleteById(any());

        when(phraseRepository.countByCategoryId("f1")).thenReturn(0L);
        service.delete("f1");
        verify(functionRepository).deleteById("f1");
    }

    @Test
    @DisplayName("update/delete -> unknown function is not found")
    void notFound() {
        when(functionRepository.findById("nope")).thenReturn(Optional.empty());
        assertThrows(DataNotFoundException.class, () -> service.update("nope", new AdminRedemittelFunctionDto("nope", "X", 0, 0)));
        assertThrows(DataNotFoundException.class, () -> service.delete("nope"));
    }
}
