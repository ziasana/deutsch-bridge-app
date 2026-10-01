package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExamTimeBulkUpdateRequest;
import com.deutschbridge.backend.model.dto.ExamTimeBulkUpdateRequest.Entry;
import com.deutschbridge.backend.model.dto.ExamTimeEntryResponse;
import com.deutschbridge.backend.model.dto.ExamTimeSettingsResponse;
import com.deutschbridge.backend.model.dto.ExamTimeUpdateRequest;
import com.deutschbridge.backend.model.entity.ExamConfiguration;
import com.deutschbridge.backend.model.entity.ExamTimeConfiguration;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.ExamConfigurationRepository;
import com.deutschbridge.backend.repository.ExamTimeConfigurationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.prepost.PreAuthorize;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExamTimeConfigurationServiceTest {

    private static final LearningLevel B1 = LearningLevel.B1;

    @Mock
    private ExamTimeConfigurationRepository timeRepository;

    @Mock
    private ExamConfigurationRepository examConfigurationRepository;

    private ExamTimeConfigurationService service;

    /** Rows "stored" in the fake repository, so saves are visible to later reads. */
    private final List<ExamTimeConfiguration> stored = new ArrayList<>();
    private ExamConfiguration storedTotal;

    @BeforeEach
    void setUp() {
        service = new ExamTimeConfigurationService(timeRepository, examConfigurationRepository, 180, 300);
        lenient().when(timeRepository.findByExamTypeAndLevel(ExamType.TELC, B1)).thenAnswer(i -> List.copyOf(stored));
        lenient().when(timeRepository.findByExamTypeAndLevelAndSectionAndTeil(eq(ExamType.TELC), eq(B1), any(), anyInt()))
                .thenAnswer(i -> stored.stream()
                        .filter(r -> r.getSection() == i.getArgument(2) && r.getTeil() == (int) i.getArgument(3))
                        .findFirst());
        lenient().when(timeRepository.save(any(ExamTimeConfiguration.class))).thenAnswer(i -> {
            ExamTimeConfiguration row = i.getArgument(0);
            if (row.getId() == null) {
                row.setId("id-" + row.getSection() + row.getTeil());
                stored.add(row);
            }
            return row;
        });
        lenient().when(examConfigurationRepository.findByExamTypeAndLevel(ExamType.TELC, B1))
                .thenAnswer(i -> Optional.ofNullable(storedTotal));
        lenient().when(examConfigurationRepository.save(any(ExamConfiguration.class))).thenAnswer(i -> {
            storedTotal = i.getArgument(0);
            return storedTotal;
        });
    }

    private static Entry entry(ExamSection section, int teil, String minutes) {
        return new Entry(section, teil, new BigDecimal(minutes), true);
    }

    private static ExamTimeBulkUpdateRequest bulk(String total, Entry... entries) {
        return new ExamTimeBulkUpdateRequest(B1, total != null ? new BigDecimal(total) : null, List.of(entries));
    }

    private ExamTimeConfiguration storedRow(ExamSection section, int teil, int minutes, boolean enabled) {
        ExamTimeConfiguration row = new ExamTimeConfiguration();
        row.setId("id-" + section + teil);
        row.setExamType(ExamType.TELC);
        row.setLevel(B1);
        row.setSection(section);
        row.setTeil(teil);
        row.setRecommendedMinutes(minutes);
        row.setEnabled(enabled);
        stored.add(row);
        return row;
    }

    private void assertRejected(String expectedFragment, ExamTimeBulkUpdateRequest request) {
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class, () -> service.saveSettings(request));
        assertTrue(e.getMessage().contains(expectedFragment), e.getMessage());
        verify(timeRepository, never()).save(any());
    }

    @Test
    @DisplayName("admin can create configurations for a level with none yet")
    void createsConfigurations() {
        ExamTimeSettingsResponse result = service.saveSettings(bulk("90",
                entry(ExamSection.LESEVERSTEHEN, 1, "15"),
                entry(ExamSection.LESEVERSTEHEN, 2, "20")));

        assertEquals(2, stored.size());
        assertEquals(35, result.configuredMinutes());
        assertEquals(55, result.reviewMinutes());
        assertEquals(90, result.totalDurationMinutes());
    }

    @Test
    @DisplayName("admin can update an existing configuration without creating a duplicate")
    void updatesExistingConfiguration() {
        storedRow(ExamSection.LESEVERSTEHEN, 2, 20, true);

        service.saveSettings(bulk(null, entry(ExamSection.LESEVERSTEHEN, 2, "25")));

        assertEquals(1, stored.size());
        assertEquals(25, stored.get(0).getRecommendedMinutes());
    }

    @Test
    @DisplayName("single-row update changes minutes and enabled flag")
    void updatesSingleRow() throws DataNotFoundException {
        ExamTimeConfiguration row = storedRow(ExamSection.LESEVERSTEHEN, 2, 20, true);
        when(timeRepository.findById(row.getId())).thenReturn(Optional.of(row));

        service.update(row.getId(), new ExamTimeUpdateRequest(new BigDecimal("18"), false));

        assertEquals(18, row.getRecommendedMinutes());
        assertFalse(row.isEnabled());
    }

    @Test
    @DisplayName("updating an unknown id is a not-found error")
    void updateUnknownId() {
        when(timeRepository.findById("nope")).thenReturn(Optional.empty());
        assertThrows(DataNotFoundException.class,
                () -> service.update("nope", new ExamTimeUpdateRequest(new BigDecimal("10"), null)));
    }

    @Test
    @DisplayName("the same part twice in one request is rejected as a duplicate")
    void rejectsDuplicateParts() {
        assertRejected("Duplicate", bulk(null,
                entry(ExamSection.LESEVERSTEHEN, 1, "15"),
                entry(ExamSection.LESEVERSTEHEN, 1, "20")));
    }

    @Test
    @DisplayName("zero, negative, fractional, missing and too-large minutes are rejected")
    void rejectsInvalidMinutes() {
        for (String bad : new String[]{"0", "-5", "20.5", "181"}) {
            assertRejected("whole number between 1 and 180", bulk(null, entry(ExamSection.LESEVERSTEHEN, 1, bad)));
        }
        assertRejected("whole number between 1 and 180", bulk(null,
                new Entry(ExamSection.LESEVERSTEHEN, 1, null, true)));
    }

    @Test
    @DisplayName("a whole number written with a trailing .0 is accepted")
    void acceptsTrailingZeroDecimal() {
        service.saveSettings(bulk(null, entry(ExamSection.LESEVERSTEHEN, 1, "20.0")));
        assertEquals(20, stored.get(0).getRecommendedMinutes());
    }

    @Test
    @DisplayName("parts the app does not support are rejected")
    void rejectsUnsupportedPart() {
        assertRejected("Unsupported exam part", bulk(null, entry(ExamSection.HOERVERSTEHEN, 1, "20")));
        assertRejected("Unsupported exam part", bulk(null, entry(ExamSection.LESEVERSTEHEN, 9, "20")));
    }

    @Test
    @DisplayName("one invalid value rejects the whole bulk save, saving nothing")
    void bulkIsAllOrNothing() {
        assertRejected("whole number", bulk(null,
                entry(ExamSection.LESEVERSTEHEN, 1, "15"),
                entry(ExamSection.LESEVERSTEHEN, 2, "0")));
        assertTrue(stored.isEmpty());
    }

    @Test
    @DisplayName("Teil times that exceed the exam duration are rejected with the overshoot")
    void rejectsConfigurationOverTotal() {
        assertRejected("exceeds exam duration by 8 minutes", bulk("85",
                entry(ExamSection.LESEVERSTEHEN, 1, "31"),
                entry(ExamSection.LESEVERSTEHEN, 2, "31"),
                entry(ExamSection.LESEVERSTEHEN, 3, "31")));
    }

    @Test
    @DisplayName("the total check includes rows already stored, not just the request")
    void totalCheckUsesStoredRows() {
        storedRow(ExamSection.LESEVERSTEHEN, 1, 50, true);
        storedTotal = totalOf(90);

        assertRejected("exceeds exam duration by 10 minutes", bulk(null, entry(ExamSection.LESEVERSTEHEN, 2, "50")));
    }

    @Test
    @DisplayName("disabled parts and Schriftlicher Ausdruck do not count towards the total")
    void totalIgnoresDisabledAndWriting() {
        storedRow(ExamSection.LESEVERSTEHEN, 1, 80, false);

        ExamTimeSettingsResponse result = service.saveSettings(new ExamTimeBulkUpdateRequest(B1, new BigDecimal("90"), List.of(
                entry(ExamSection.LESEVERSTEHEN, 2, "60"),
                entry(ExamSection.SCHRIFTLICHER_AUSDRUCK, 1, "30"))));

        assertEquals(60, result.configuredMinutes());
        assertEquals(30, result.reviewMinutes());
    }

    @Test
    @DisplayName("no total duration configured: nothing to validate against and no review time reported")
    void missingTotalIsHandledGracefully() {
        ExamTimeSettingsResponse result = service.saveSettings(bulk(null, entry(ExamSection.LESEVERSTEHEN, 1, "170")));

        assertNull(result.totalDurationMinutes());
        assertNull(result.reviewMinutes());
    }

    @Test
    @DisplayName("settings list every supported part, with null minutes for unconfigured ones")
    void settingsListAllSupportedParts() {
        storedRow(ExamSection.LESEVERSTEHEN, 1, 15, true);

        ExamTimeSettingsResponse result = service.getSettings(B1);

        assertEquals(ExamTimeDefaults.SUPPORTED_PARTS.size(), result.entries().size());
        ExamTimeEntryResponse first = result.entries().get(0);
        assertEquals(15, first.recommendedMinutes());
        assertNull(result.entries().get(1).recommendedMinutes());
        assertNull(result.entries().get(1).id());
    }

    @Test
    @DisplayName("learners only see enabled configurations")
    void learnersSeeOnlyEnabled() {
        storedRow(ExamSection.LESEVERSTEHEN, 1, 15, true);
        storedRow(ExamSection.LESEVERSTEHEN, 2, 20, false);

        assertEquals(1, service.findEnabledForLevel(B1).size());
        assertEquals(Optional.of(900), service.targetSeconds(B1, ExamSection.LESEVERSTEHEN, 1));
        assertEquals(Optional.empty(), service.targetSeconds(B1, ExamSection.LESEVERSTEHEN, 2));
    }

    @Test
    @DisplayName("missing configuration is a not-found for the targeted learner lookup")
    void missingConfigurationNotFound() {
        assertThrows(DataNotFoundException.class, () -> service.findEnabled(B1, ExamSection.LESEVERSTEHEN, 1));
        assertEquals(Optional.empty(), service.targetSeconds(B1, ExamSection.LESEVERSTEHEN, 1));
    }

    @Test
    @DisplayName("seeding adds the B1 defaults and total, and leaves existing edits alone")
    void seedsDefaultsWithoutOverwriting() {
        storedRow(ExamSection.LESEVERSTEHEN, 2, 25, true);

        service.seedDefaults();

        assertEquals(6, stored.size());
        assertEquals(25, stored.stream().filter(r -> r.getSection() == ExamSection.LESEVERSTEHEN && r.getTeil() == 2)
                .findFirst().orElseThrow().getRecommendedMinutes());
        ArgumentCaptor<ExamConfiguration> captor = ArgumentCaptor.forClass(ExamConfiguration.class);
        verify(examConfigurationRepository).save(captor.capture());
        assertEquals(90, captor.getValue().getTotalDurationMinutes());
    }

    @Test
    @DisplayName("B1 defaults fit inside the default total with 5 review minutes")
    void defaultsLeaveFiveReviewMinutes() {
        service.seedDefaults();

        ExamTimeSettingsResponse result = service.getSettings(B1);
        assertEquals(85, result.configuredMinutes());
        assertEquals(5, result.reviewMinutes());
    }

    @Test
    @DisplayName("only admins can reach the admin timing endpoints")
    void adminControllerRequiresAdminRole() {
        PreAuthorize annotation = com.deutschbridge.backend.controller.AdminExamTimeConfigurationController.class
                .getAnnotation(PreAuthorize.class);
        assertNotNull(annotation);
        assertEquals("hasRole('ADMIN')", annotation.value());
    }

    private static ExamConfiguration totalOf(int minutes) {
        ExamConfiguration config = new ExamConfiguration();
        config.setExamType(ExamType.TELC);
        config.setLevel(B1);
        config.setTotalDurationMinutes(minutes);
        config.setEnabled(true);
        return config;
    }
}
