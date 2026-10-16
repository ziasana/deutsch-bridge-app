import api from "./api";
import type {
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
