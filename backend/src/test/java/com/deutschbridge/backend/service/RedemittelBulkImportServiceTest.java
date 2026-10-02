package com.deutschbridge.backend.service;

import com.deutschbridge.backend.RedemittelTestFunctions;
import com.deutschbridge.backend.model.dto.AdminWritingPhraseDto;
import com.deutschbridge.backend.model.dto.RedemittelBulkImportResult;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.RedemittelFunctionRepository;
import com.deutschbridge.backend.repository.WritingPhraseRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RedemittelBulkImportServiceTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Mock private WritingContentAdminService contentService;
    @Mock private RedemittelExerciseAdminService exerciseService;
    @Mock private WritingPhraseRepository phraseRepository;
    @Mock private RedemittelFunctionRepository functionRepository;
    private RedemittelBulkImportService service;

    @BeforeEach
    void setUp() {
        service = new RedemittelBulkImportService(contentService, exerciseService, phraseRepository, functionRepository, MAPPER);
        when(functionRepository.findAll()).thenReturn(RedemittelTestFunctions.all());
        when(contentService.createPhrase(any())).thenAnswer(inv -> {
            AdminWritingPhraseDto d = inv.getArgument(0);
            return new AdminWritingPhraseDto("new-id", d.level(), d.category(), d.phrase(), null, null, null, null, 0, true,
                    null, null, null, null, List.of(), List.of());
        });
    }

    private List<JsonNode> rows(String json) throws Exception {
        return MAPPER.convertValue(MAPPER.readTree(json), MAPPER.getTypeFactory().constructCollectionType(List.class, JsonNode.class));
    }

    @Test
    @DisplayName("imports a row, resolving the function by name and saving its exercises")
    void imports() throws Exception {
        RedemittelBulkImportResult r = service.bulkImport(rows("""
                [{"level":"B1","function":"meinung äußern","phrase":"Ich finde, dass …",
                  "exercises":[{"type":"MEANING","correctAnswer":"I think","wrongAnswers":["I know","I see"]}]}]"""));
        assertEquals(1, r.successCount());
        ArgumentCaptor<AdminWritingPhraseDto> dto = ArgumentCaptor.forClass(AdminWritingPhraseDto.class);
        verify(contentService).createPhrase(dto.capture());
        assertEquals("OPINION", dto.getValue().category());
        assertTrue(dto.getValue().active());
        verify(exerciseService).replace(eq("new-id"), anyList());
    }

    @Test
    @DisplayName("a bad row is reported and does not block the others")
    void perRowErrors() throws Exception {
        when(phraseRepository.existsByLevelAndPhraseIgnoreCase(LearningLevel.B1, "Gibt es schon")).thenReturn(true);
        RedemittelBulkImportResult r = service.bulkImport(rows("""
                [{"level":"B1","function":"Unbekannt","phrase":"A"},
                 {"level":"B1","function":"Bitten"},
                 {"level":"B1","function":"Bitten","phrase":"Gibt es schon"},
                 {"level":"XX","function":"Bitten","phrase":"B"},
                 {"level":"B1","function":"Bitten","phrase":"C","exercises":[{"type":"FILL_BLANK","prompt":"kein Blank","correctAnswer":"x"}]},
                 {"level":"B1","function":"Bitten","phrase":"Gut"}]"""));
        assertEquals(6, r.totalCount());
        assertEquals(1, r.successCount());
        assertTrue(r.rows().get(0).errorMessage().contains("Unknown function"));
        assertTrue(r.rows().get(1).errorMessage().contains("\"phrase\" is required"));
        assertTrue(r.rows().get(2).errorMessage().contains("already exists"));
        assertTrue(r.rows().get(3).errorMessage().contains("level"));
        assertTrue(r.rows().get(4).errorMessage().startsWith("exercises[0]"));
        assertTrue(r.rows().get(5).success());
        verify(contentService, times(1)).createPhrase(any());
    }
}
