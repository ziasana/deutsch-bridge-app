import api from "./api";
import { DictionaryEntry, ReportMissingWordRequest } from "@/types/dictionary";

export const lookupDictionaryEntry = async (lemma: string) => {
    return await api.get<DictionaryEntry>(`/dictionary/${encodeURIComponent(lemma)}`);
};

export const reportMissingWord = async (lemma: string, note?: string) => {
    const request: ReportMissingWordRequest = { note: note ?? null };
    return await api.post(`/dictionary/${encodeURIComponent(lemma)}/report-missing`, request);
};
