import api from "./api";
import {
    AnswerItem,
    AudioPlayResponse,
    AttemptState,
    AttemptSummary,
    HistoryResponse,
    ProfileOverview,
    ResultResponse,
    SaveAnswersResponse,
} from "@/types/examSimulation";

const base = "/exam-simulation";

export const getSimulationProfiles = () => api.get<ProfileOverview[]>(`${base}/profiles`);

export const getSimulationProfile = (profileId: string) => api.get<ProfileOverview>(`${base}/profiles/${profileId}`);

export const startSimulationAttempt = (profileId: string) => api.post<AttemptState>(`${base}/attempts`, { profileId });

export const getSimulationHistory = () => api.get<HistoryResponse>(`${base}/attempts`);

export const getSimulationAttempt = (attemptId: string) => api.get<AttemptState>(`${base}/attempts/${attemptId}`);

/** Re-enters a running attempt after a refresh; the server may limit how often this is allowed. */
export const resumeSimulationAttempt = (attemptId: string) => api.post<AttemptState>(`${base}/attempts/${attemptId}/resume`);

/** Pauses the exam: the server stops the section clock and stops sending the tasks. */
export const pauseSimulationAttempt = (attemptId: string) => api.post<AttemptState>(`${base}/attempts/${attemptId}/pause`);

/** Continues a paused exam with exactly the time that was left. */
export const continueSimulationAttempt = (attemptId: string) => api.post<AttemptState>(`${base}/attempts/${attemptId}/continue`);

/** Idempotent upsert, safe to retry. The server decides whether each answer is still accepted. */
export const saveSimulationAnswers = (attemptId: string, answers: AnswerItem[]) =>
    api.put<SaveAnswersResponse>(`${base}/attempts/${attemptId}/answers`, { answers });

export const completeSimulationSection = (attemptId: string) =>
    api.post<AttemptState>(`${base}/attempts/${attemptId}/sections/current/complete`);

export const submitSimulationAttempt = (attemptId: string) => api.post<ResultResponse>(`${base}/attempts/${attemptId}/submit`);

export const cancelSimulationAttempt = (attemptId: string) => api.post<AttemptSummary>(`${base}/attempts/${attemptId}/cancel`);

export const getSimulationResult = (attemptId: string) => api.get<ResultResponse>(`${base}/attempts/${attemptId}/result`);

/** Counts one play of a listening clip on the server; the audio may only start after this succeeds. */
export const playSimulationAudio = (attemptId: string, partKey: string, passageId: string) =>
    api.post<AudioPlayResponse>(`${base}/attempts/${attemptId}/parts/${partKey}/audio/${passageId}/play`);
