import api from "./api";
import { Expression, ExpressionManualRequest } from "@/types/expression";

export const getExpressionsAdmin = async () => {
  return await api.get<Expression[]>("/admin/expressions");
};

export const createExpression = async (request: ExpressionManualRequest) => {
  return await api.post<Expression>("/admin/expressions", request);
};

export const updateExpression = async (id: string, request: Partial<ExpressionManualRequest>) => {
  return await api.put<Expression>(`/admin/expressions/${id}`, request);
};

export const deleteExpression = async (id: string) => {
  return await api.delete(`/admin/expressions/${id}`);
};
