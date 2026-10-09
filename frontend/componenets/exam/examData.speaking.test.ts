import { describe, expect, it } from "vitest";
import { EXAM_TYPE_META, EXAM_TYPE_ORDER } from "./examMeta";
import { exercisesForSectionAndLevel, findContinueTarget, findGroupByKey, groupIntoParts } from "./examData";
import { ExamExerciseSummaryResponse } from "@/types/exam";

function item(id: string, title: string, partNumber: number, taskType: ExamExerciseSummaryResponse["taskType"], completed = false): ExamExerciseSummaryResponse {
    return {
        id,
        title,
        section: "MUENDLICHER_AUSDRUCK",
        taskType,
        level: "B1",
        partNumber,
        teil: partNumber,
        teilDescription: null,
        questionsCount: 0,
        completed,
        lastScore: null,
        bookmarked: false,
    };
}

const exercises: ExamExerciseSummaryResponse[] = [
    item("p3", "1. Abschiedsparty", 3, "JOINT_PLANNING"),
    item("p1", "1. Kennenlernen", 1, "TOPIC_INTERVIEW", true),
    item("p2b", "2. Reisen", 2, "OPINION_DISCUSSION"),
    item("p2a", "1. Gruppenreisen", 2, "OPINION_DISCUSSION"),
    { ...item("r1", "Lesen", 1, "MATCHING"), section: "LESEVERSTEHEN" },
];

describe("Mündlicher Ausdruck in the exam-prep module", () => {
    it("is part of the module navigation", () => {
        expect(EXAM_TYPE_ORDER).toContain("MUENDLICHER_AUSDRUCK");
        expect(EXAM_TYPE_META.MUENDLICHER_AUSDRUCK.label).toBe("Mündlicher Ausdruck");
    });

    it("groups the exercises into the three Teile in order", () => {
        const groups = groupIntoParts(exercisesForSectionAndLevel(exercises, "MUENDLICHER_AUSDRUCK", "B1"), "MUENDLICHER_AUSDRUCK");
        expect(groups.map((g) => g.key)).toEqual(["1", "2", "3"]);
        expect(groups.map((g) => g.subheading)).toEqual(["Einander kennenlernen", "Über ein Thema sprechen", "Gemeinsam etwas planen"]);
        expect(groups[1].items.map((i) => i.id)).toEqual(["p2a", "p2b"]);
        expect(groups[0].state).toBe("completed");
        expect(groups[1].state).toBe("not_started");
    });

    it("finds a Teil by its key and ignores other sections", () => {
        expect(findGroupByKey(exercises, "MUENDLICHER_AUSDRUCK", "B1", "3")?.items[0].id).toBe("p3");
        expect(findGroupByKey(exercises, "MUENDLICHER_AUSDRUCK", "B1", "4")).toBeNull();
        expect(exercisesForSectionAndLevel(exercises, "MUENDLICHER_AUSDRUCK", "B1")).toHaveLength(4);
    });

    it("offers an unfinished speaking Teil to continue with", () => {
        const target = findContinueTarget(exercises.filter((e) => e.section === "MUENDLICHER_AUSDRUCK"), "B1", "MUENDLICHER_AUSDRUCK");
        expect(target?.section).toBe("MUENDLICHER_AUSDRUCK");
        expect(["p2a", "p2b", "p3"]).toContain(target?.exerciseId);
    });

    it("has no groups for a level without speaking exercises", () => {
        expect(groupIntoParts(exercisesForSectionAndLevel(exercises, "MUENDLICHER_AUSDRUCK", "A2"), "MUENDLICHER_AUSDRUCK")).toEqual([]);
    });
});
