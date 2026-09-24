import api from "./api";
import {
  Expression,
  ExpressionCollectionSummary,
  ExpressionContinueLearning,
  ExpressionPage,
  ExpressionType,
} from "@/types/expression";

export interface ExpressionsPageParams {
  level?: string;
  search?: string;
  progress?: string;
  bookmarked?: boolean;
  sort?: "recommended" | "progress" | "alphabetical";
}

export const getExpressionCollectionSummary = async () => {
  return await api.get<ExpressionCollectionSummary[]>("/expressions/collection-summary");
};

export const getExpressionsPage = async (
  type: ExpressionType,
  page: number,
  size: number,
  params: ExpressionsPageParams = {},
) => {
  return await api.get<ExpressionPage>("/expressions", {
    params: {
      type,
      page,
      size,
      level: params.level && params.level !== "ALL" ? params.level : undefined,
      search: params.search || undefined,
      progress: params.progress && params.progress !== "ALL" ? params.progress : undefined,
      bookmarked: params.bookmarked || undefined,
      sort: params.sort,
    },
  });
};

export const getContinueLearningExpressions = async (type: ExpressionType) => {
  return await api.get<ExpressionContinueLearning>("/expressions/continue-learning", { params: { type } });
};

export const getDifficultExpressions = async () => {
  return await api.get<Expression[]>("/expressions/difficult");
};

export const getExpressionById = async (id: string) => {
  return await api.get<Expression>(`/expressions/${id}`);
};

export const markExpressionViewed = async (id: string) => {
  return await api.post<Expression>(`/expressions/${id}/view`);
};

export const addExpressionBookmark = async (id: string) => {
  return await api.post<Expression>(`/expressions/${id}/bookmark`);
};

export const removeExpressionBookmark = async (id: string) => {
  return await api.delete<Expression>(`/expressions/${id}/bookmark`);
};
