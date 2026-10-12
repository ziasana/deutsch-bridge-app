package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.model.dto.examsim.ExamProfileRequest;
import com.deutschbridge.backend.model.entity.ExamProfile;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.*;
import com.deutschbridge.backend.util.JWTUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** HTTP level: authentication, admin authorisation, attempt ownership and the shape of error responses. */
@Testcontainers
@SpringBootTest(properties = {"notifications.scheduler.enabled=false", "exam.simulation.seed-default-profile=false"})
@ActiveProfiles("test")
@AutoConfigureMockMvc
class ExamSimulationApiTest {

    private static final LearningLevel LEVEL = LearningLevel.C1;

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;
    @Autowired private JWTUtil jwtUtil;
    @Autowired private UserRepository userRepository;
    @Autowired private ExamProfileService profileService;
    @Autowired private ExamExerciseRepository exerciseRepository;
    @Autowired private ExamProfileRepository profileRepository;
    @Autowired private ExamSimulationAttemptRepository attemptRepository;
    @Autowired private ExamSimulationAttemptPartRepository partRepository;
    @Autowired private ExamSimulationAnswerRepository answerRepository;
    @Autowired private ExamSimulationUsageRepository usageRepository;
    @Autowired private ExamSimulationAssessmentRepository assessmentRepository;
    @Autowired private ExamSimulationAuditRepository auditRepository;

    private final List<String> exerciseIds = new ArrayList<>();
    private final List<User> users = new ArrayList<>();
    private ExamProfile profile;
    private String studentA;
    private String studentB;
    private String admin;

    @BeforeEach
    void setUp() throws Exception {
        exerciseIds.addAll(ExamSimulationFixtures.createPool(exerciseRepository, LEVEL, 2));
        ExamProfileRequest base = TelcB1ProfileFactory.request();
        ExamProfile draft = profileService.create(new ExamProfileRequest("API_" + UUID.randomUUID(), base.provider(), base.examName(), "API-Test", null, base.examType(), LEVEL,
                false, base.writtenMaxPoints(), base.writtenPassThreshold(), base.oralMaxPoints(), base.oralPassThreshold(), base.overallResultPolicy(),
                base.answerReleasePolicy(), null, false, base.config()), "admin");
        profile = profileService.publish(draft.getId(), "Test", "admin");
        studentA = token("STUDENT");
        studentB = token("STUDENT");
        admin = token("ADMIN");
    }

    @AfterEach
    void tearDown() {
        auditRepository.deleteAll();
        assessmentRepository.deleteAll();
        answerRepository.deleteAll();
        partRepository.deleteAll();
        usageRepository.deleteAll();
        attemptRepository.deleteAll();
        profileRepository.deleteAll();
        exerciseRepository.deleteAllById(exerciseIds);
        userRepository.deleteAll(users);
    }

    private String token(String role) {
        User u = new User("api-" + UUID.randomUUID(), "api-" + UUID.randomUUID() + "@test.local", "x");
        u.setRole(role);
        u.setVerified(true);
        users.add(userRepository.save(u));
        return jwtUtil.generateAccessToken(u.getEmail());
    }

    private MockHttpServletRequestBuilder as(String token, MockHttpServletRequestBuilder b) {
        return b.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON);
    }

    private JsonNode read(MvcResult r) throws Exception {
        return json.readTree(r.getResponse().getContentAsString());
    }

    @Test
    @DisplayName("Anonymous requests are rejected")
    void anonymous() throws Exception {
        mvc.perform(get("/api/exam-simulation/profiles")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/exam-simulation/profiles")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Admin endpoints are closed to students and open to administrators")
    void adminAuthorisation() throws Exception {
        mvc.perform(as(studentA, get("/api/admin/exam-simulation/profiles"))).andExpect(status().isForbidden());
        mvc.perform(as(studentA, post("/api/admin/exam-simulation/profiles/" + profile.getId() + "/publish"))).andExpect(status().isForbidden());
        mvc.perform(as(studentA, post("/api/admin/exam-simulation/profiles/" + profile.getId() + "/duplicate"))).andExpect(status().isForbidden());
        mvc.perform(as(studentA, get("/api/admin/exam-simulation/assessments/queue"))).andExpect(status().isForbidden());
        mvc.perform(as(studentA, put("/api/admin/exam-simulation/attempts/x/parts/SCHRIFTLICHER_AUSDRUCK/assessment").content("{}"))).andExpect(status().isForbidden());
        mvc.perform(as(admin, get("/api/admin/exam-simulation/profiles"))).andExpect(status().isOk());
        mvc.perform(as(admin, get("/api/admin/exam-simulation/profiles/" + profile.getId() + "/availability"))).andExpect(status().isOk());
        mvc.perform(as(admin, post("/api/admin/exam-simulation/profiles/" + profile.getId() + "/validate"))).andExpect(status().isOk());
    }

    @Test
    @DisplayName("Students list profiles and only published ones are offered")
    void studentSeesPublishedProfiles() throws Exception {
        MvcResult r = mvc.perform(as(studentA, get("/api/exam-simulation/profiles"))).andExpect(status().isOk()).andReturn();
        boolean found = false;
        for (JsonNode p : read(r)) found |= p.get("id").asText().equals(profile.getId());
        assertTrue(found);
    }

    @Test
    @DisplayName("Attempt ownership is enforced; answers, scores and keys never come from or leak to the wrong party")
    void ownershipOverHttp() throws Exception {
        MvcResult started = mvc.perform(as(studentA, post("/api/exam-simulation/attempts").content("{\"profileId\":\"" + profile.getId() + "\"}")))
                .andExpect(status().isCreated()).andReturn();
        String body = started.getResponse().getContentAsString();
        assertFalse(body.contains("correctAnswer"));
        String attemptId = json.readTree(body).get("attemptId").asText();
        String base = "/api/exam-simulation/attempts/" + attemptId;

        // second start while one is running: 409 with a machine readable code and the running attempt id
        MvcResult dup = mvc.perform(as(studentA, post("/api/exam-simulation/attempts").content("{\"profileId\":\"" + profile.getId() + "\"}")))
                .andExpect(status().isConflict()).andReturn();
        assertEquals("ACTIVE_ATTEMPT_EXISTS", read(dup).get("code").asText());
        assertEquals(attemptId, read(dup).get("details").get("attemptId").asText());

        mvc.perform(as(studentA, get(base))).andExpect(status().isOk());
        mvc.perform(as(studentB, get(base))).andExpect(status().isNotFound());
        mvc.perform(as(studentB, post(base + "/resume"))).andExpect(status().isNotFound());
        mvc.perform(as(studentB, put(base + "/answers").content("{\"answers\":[]}"))).andExpect(status().isNotFound());
        mvc.perform(as(studentB, post(base + "/sections/current/complete"))).andExpect(status().isNotFound());
        mvc.perform(as(studentB, post(base + "/submit"))).andExpect(status().isNotFound());
        mvc.perform(as(studentB, post(base + "/cancel"))).andExpect(status().isNotFound());
        mvc.perform(as(studentB, get(base + "/result"))).andExpect(status().isNotFound());

        // result of a running attempt is not available yet
        mvc.perform(as(studentA, get(base + "/result"))).andExpect(status().isConflict());

        // autosave with a client-supplied "score" field is simply ignored: scoring is computed server side
        mvc.perform(as(studentA, put(base + "/answers").content("{\"answers\":[],\"score\":225,\"passed\":true}"))).andExpect(status().isOk());

        MvcResult submitted = mvc.perform(as(studentA, post(base + "/submit"))).andExpect(status().isOk()).andReturn();
        assertEquals("COMPLETED", read(submitted).get("status").asText());
        assertEquals("0.0", read(submitted).get("result").get("writtenScore").asText());
        mvc.perform(as(studentA, post(base + "/submit"))).andExpect(status().isOk());
    }
}
