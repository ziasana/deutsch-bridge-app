import type { ReactNode } from 'react';
import { ContentScale } from '@/components/content/RichContent';
import { RICH_BASE_RATIO, useExamTextScale } from '../textScale';

/** Applies the learner's exam text size to all rich text (passages, transcripts, info pages) below. */
export function RichContentScale({ children }: { children: ReactNode }) {
  return (
    <ContentScale.Provider value={useExamTextScale() * RICH_BASE_RATIO}>
      {children}
    </ContentScale.Provider>
  );
}
