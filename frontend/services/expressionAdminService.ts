import api from "./api";
import { Expression, ExpressionBulkImportResult, ExpressionManualRequest } from "@/types/expression";

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

export const uploadExpressionImage = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return await api.post<{ url: string }>("/admin/expressions/upload-image", formData, {
    headers: { "Content-Type": undefined },
  });
};

export const bulkImportExpressions = async (rows: unknown[]) => {
  return await api.post<ExpressionBulkImportResult>("/admin/expressions/bulk", rows);
};
