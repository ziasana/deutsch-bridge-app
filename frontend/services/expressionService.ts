import api from "./api";
import { Expression, ExpressionType } from "@/types/expression";

export const getExpressions = async (type?: ExpressionType) => {
  return await api.get<Expression[]>("/expressions", { params: type ? { type } : {} });
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
