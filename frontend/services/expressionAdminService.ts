import api from "./api";
import { Expression, ExpressionAdminRow, ExpressionBulkImportResult, ExpressionManualRequest } from "@/types/expression";

export interface ExpressionFilters {
  type?: string;
  level?: string;
  status?: string;
  search?: string;
}

export const getExpressionsAdmin = async (filters: ExpressionFilters = {}) => {
  return await api.get<ExpressionAdminRow[]>("/admin/expressions", { params: filters });
};

export const getExpressionAdmin = async (id: string) => {
  return await api.get<Expression>(`/admin/expressions/${id}`);
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

/** Not yet wired into the admin form - no expression view currently renders a separate thumbnail size. */
export const uploadExpressionThumbnail = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return await api.post<{ url: string }>("/admin/expressions/upload-thumbnail", formData, {
    headers: { "Content-Type": undefined },
  });
};

export const bulkImportExpressions = async (rows: unknown[]) => {
  return await api.post<ExpressionBulkImportResult>("/admin/expressions/bulk", rows);
};
