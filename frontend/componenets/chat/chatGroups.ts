import type { ChatSessionDto } from "@/types/chat";

export interface SessionGroup {
    key: "today" | "yesterday" | "earlier";
    sessions: ChatSessionDto[];
}

function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Groups sessions into Today/Yesterday/Earlier by createdAt, preserving the incoming (newest-first)
 *  order within each group. Sessions without a createdAt (shouldn't happen once the backend always
 *  sets it, but keep this defensive) fall into "earlier". */
export function groupSessionsByDate(sessions: ChatSessionDto[]): SessionGroup[] {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const today: ChatSessionDto[] = [];
    const yesterdayList: ChatSessionDto[] = [];
    const earlier: ChatSessionDto[] = [];

    for (const session of sessions) {
        const createdAt = session.createdAt ? new Date(session.createdAt) : null;
        if (createdAt && isSameDay(createdAt, now)) {
            today.push(session);
        } else if (createdAt && isSameDay(createdAt, yesterday)) {
            yesterdayList.push(session);
        } else {
            earlier.push(session);
        }
    }

    const groups: SessionGroup[] = [
        { key: "today", sessions: today },
        { key: "yesterday", sessions: yesterdayList },
        { key: "earlier", sessions: earlier },
    ];
    return groups.filter((g) => g.sessions.length > 0);
}
