import { vi } from "vitest";

/** An in-memory stand-in for the saved generator topic list API (one list per part key), shared by the generator tests. */
let store: Record<string, { custom: string[]; hidden: string[] }> = {};
const entry = (partKey: string) => (store[partKey] ??= { custom: [], hidden: [] });
const reply = (partKey: string) => Promise.resolve({ data: { custom: [...entry(partKey).custom], hidden: [...entry(partKey).hidden] } });

export const resetTopicApi = () => {
    store = {};
};

export const topicApiMock = {
    getGeneratorTopics: vi.fn((partKey: string) => reply(partKey)),
    addGeneratorTopic: vi.fn((partKey: string, topic: string) => {
        const e = entry(partKey);
        if (!e.custom.some((t) => t.toLowerCase() === topic.toLowerCase())) e.custom.push(topic);
        return reply(partKey);
    }),
    removeGeneratorTopic: vi.fn((partKey: string, topic: string) => {
        const e = entry(partKey);
        e.custom = e.custom.filter((t) => t.toLowerCase() !== topic.toLowerCase());
        return reply(partKey);
    }),
    setGeneratorTopicHidden: vi.fn((partKey: string, topic: string, hidden: boolean) => {
        const e = entry(partKey);
        e.hidden = hidden ? [...new Set([...e.hidden, topic])] : e.hidden.filter((t) => t !== topic);
        return reply(partKey);
    }),
    restoreGeneratorTopics: vi.fn((partKey: string) => {
        entry(partKey).hidden = [];
        return reply(partKey);
    }),
};
