import api from "./api";
import type { RedemittelAnswer, RedemittelExercise } from "@/types/redemittel";
import type {
    PublicExpressionPractice,
    PublicProductionResult,
    PublicTransformationResult,
    PublicQuestionResult,
    PublicRecallResult,
    PublicArticleFull,
    PublicArticlePage,
    PublicExpressionFull,
    PublicGrammarFull,
    PublicGrammarLevelView,
    PublicOverview,
    PublicPage,
    PublicExpressionItem,
    PublicPhrasePage,
} from "@/types/publicLearn";

const base = "/public/learn";

/** Everything here works without a login. Detail calls answer 403 for a locked item. */
export const getPublicOverview = () => api.get<PublicOverview>(`${base}/overview`);

export const getPublicGrammarLevel = (level: string) => api.get<PublicGrammarLevelView>(`${base}/grammar`, { params: { level } });
export const getPublicGrammarLesson = (id: string) => api.get<PublicGrammarFull>(`${base}/grammar/${id}`);

export const getPublicRedemittel = (params: { level?: string; category?: string; page: number; size: number }) =>
    api.get<PublicPhrasePage>(`${base}/redemittel`, { params });

export const getPublicExpressions = (params: { type: string; level: string; page: number; size: number }) =>
    api.get<PublicPage<PublicExpressionItem>>(`${base}/expressions`, { params });
export const getPublicExpression = (id: string) => api.get<PublicExpressionFull>(`${base}/expressions/${id}`);

export const getPublicReading = (params: { level: string; category?: string; page: number; size: number }) =>
    api.get<PublicArticlePage>(`${base}/reading`, { params });
export const getPublicArticle = (id: string) => api.get<PublicArticleFull>(`${base}/reading/${id}`);

/** Practice of the free items. Answers are graded on the server and nothing is stored. */
export const getPublicRedemittelExercises = (id: string) => api.get<RedemittelExercise[]>(`${base}/redemittel/${id}/exercises`);
export const answerPublicRedemittel = (id: string, exerciseId: string, answer: string) =>
    api.post<RedemittelAnswer>(`${base}/redemittel/${id}/answer`, { exerciseId, answer });

export const getPublicExpressionPractice = (id: string) => api.get<PublicExpressionPractice>(`${base}/expressions/${id}/practice`);
export const answerPublicExpressionRecall = (id: string, answer: string) =>
    api.post<PublicRecallResult>(`${base}/expressions/${id}/practice/recall`, { answer });
export const answerPublicExpressionQuestion = (id: string, questionId: string, optionId: string) =>
    api.post<PublicQuestionResult>(`${base}/expressions/${id}/practice/question`, { questionId, optionId });

/** Graded by the AI teacher; a visitor gets a few checks per hour, then the call answers 429. */
export const answerPublicExpressionProduction = (id: string, sentence: string) =>
    api.post<PublicProductionResult>(`${base}/expressions/${id}/practice/production`, { sentence });
export const answerPublicExpressionTransformation = (id: string, questionId: string, sentence: string) =>
    api.post<PublicTransformationResult>(`${base}/expressions/${id}/practice/transformation`, { questionId, sentence });
