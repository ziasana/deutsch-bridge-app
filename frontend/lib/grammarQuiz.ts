import { QuizQuestion } from "@/types/grammar";

const normalize = (value: string) => value.trim().toLowerCase();

/** Whether a quiz question can actually be shown and answered (has text, options/answer that make sense). */
export function isPlayableQuestion(q: QuizQuestion): boolean {
    if (!q.question?.trim()) return false;
    switch (q.type) {
        case "mcq": {
            const options = (q.options ?? []).map((o) => o.trim()).filter(Boolean);
            return options.length >= 2 && typeof q.answer === "string" && options.some((o) => normalize(o) === normalize(q.answer as string));
        }
        case "truefalse":
            return typeof q.answer === "boolean" || ["true", "false"].includes(normalize(String(q.answer ?? "")));
        case "fill":
            return typeof q.answer === "string" && q.answer.trim() !== "";
        default:
            return false;
    }
}
