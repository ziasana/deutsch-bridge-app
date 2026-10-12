import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react';
import type { ScrollView, View } from 'react-native';

export type ScrollAnchors = {
  scrollRef: React.RefObject<ScrollView | null>;
  contentRef: React.RefObject<View | null>;
  /** Registers the view of a question so the overview can scroll to it. */
  register: (id: string, view: View | null) => void;
  scrollTo: (id: string) => void;
};

const Ctx = createContext<Pick<ScrollAnchors, 'register'>>({ register: () => {} });

/** Lets a question card announce itself, so the overview can scroll to it. */
export const useScrollAnchors = () => useContext(Ctx);

/** Owned by the screen with the ScrollView: question cards register their view, `scrollTo(id)` brings one into view. */
export function useScrollAnchorController(): ScrollAnchors {
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const views = useRef(new Map<string, View>());
  const register = useCallback((id: string, view: View | null) => {
    if (view) views.current.set(id, view);
    else views.current.delete(id);
  }, []);
  const scrollTo = useCallback((id: string) => {
    const view = views.current.get(id);
    const content = contentRef.current;
    if (!view || !content) return;
    view.measureLayout(
      content,
      (_x, y) => scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true }),
      () => {},
    );
  }, []);
  return useMemo(() => ({ scrollRef, contentRef, register, scrollTo }), [register, scrollTo]);
}

export function ScrollAnchorsProvider({ register, children }: { register: ScrollAnchors['register']; children: ReactNode }) {
  const value = useMemo(() => ({ register }), [register]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
