import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const EXAM_TEXT_STORAGE_KEY = 'exam-text-size';

/** Multipliers for exam text; index 1 is the normal size. */
export const TEXT_SCALES = [0.9, 1, 1.15, 1.3] as const;

type TextSizeState = {
  index: number;
  larger: () => void;
  smaller: () => void;
};

/** The learner's preferred text size in exercises. Persisted, so it applies to every exercise. */
export const useExamTextSize = create<TextSizeState>()(
  persist(
    (set) => ({
      index: 1,
      larger: () => set((s) => ({ index: Math.min(TEXT_SCALES.length - 1, s.index + 1) })),
      smaller: () => set((s) => ({ index: Math.max(0, s.index - 1) })),
    }),
    {
      name: EXAM_TEXT_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ index: s.index }),
    },
  ),
);

/** Current multiplier, for sizing native text in the exam screens. */
export const useExamTextScale = () => TEXT_SCALES[useExamTextSize((s) => s.index)] ?? 1;

/** Font size + line height scaled by the multiplier, as a style fragment. */
export const scaledText = (size: number, lineHeight: number, scale: number) => ({
  fontSize: Math.round(size * scale),
  lineHeight: Math.round(lineHeight * scale),
});

/** One reading size for passage, question and answers, so they feel like one page. */
export const BODY_SIZE = 17;
export const BODY_LINE = 25;
/** Rich text renders from a 16px base; this ratio lifts it to the shared body size. */
export const RICH_BASE_RATIO = BODY_SIZE / 16;
