import api from "./api";
import {
  PracticeSession,
  RecallAnswerRequest,
  RecallAnswerResponse,
  ProductionAnswerRequest,
  ProductionAnswerResponse,
  QuestionAnswerRequest,
  QuestionAnswerResponse,
  TransformationAnswerRequest,
  TransformationAnswerResponse,
} from "@/types/expression";

export const getPracticeSession = async (expressionId?: string) => {
  return await api.get<PracticeSession>("/expressions/practice/session", {
    params: expressionId ? { expressionId } : {},
  });
};

export const submitRecallAnswer = async (request: RecallAnswerRequest) => {
  return await api.post<RecallAnswerResponse>("/expressions/practice/recall", request);
};

export const submitQuestionAnswer = async (request: QuestionAnswerRequest) => {
  return await api.post<QuestionAnswerResponse>("/expressions/practice/question", request);
};

export const submitTransformationAnswer = async (request: TransformationAnswerRequest) => {
  return await api.post<TransformationAnswerResponse>("/expressions/practice/transformation", request);
};

export const submitProductionAnswer = async (request: ProductionAnswerRequest) => {
  return await api.post<ProductionAnswerResponse>("/expressions/practice/production", request);
};
