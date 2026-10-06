import type { TextStyle } from 'react-native';

/**
 * German learning content (reading texts, example sentences, headwords) is always left-to-right,
 * even inside a Persian (RTL) interface. Spread onto a Text style to pin it. Only writingDirection is set: React Native flips
 * explicit textAlign left/right under an RTL layout, while natural alignment follows the text.
 */
export const ltrText: TextStyle = { writingDirection: 'ltr' };

/** Persian content (translations, meanings) inside any interface. */
export const rtlText: TextStyle = { writingDirection: 'rtl' };

const RTL_CHARS = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;

/** Plain text of a React children value (strings and numbers only), for direction sniffing. */
function textOf(children: unknown): string {
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(textOf).join('');
  return '';
}

/** True when the children contain Persian/Arabic/Hebrew characters. */
export const hasRtlText = (children: unknown) => RTL_CHARS.test(textOf(children));

const LTR_CHARS = /[A-Za-z\u00C0-\u024F]/;

/**
 * Direction of a piece of text by its first strong character, like the browser's dir="auto"
 * (and the web app's lesson renderer): Persian stays RTL, German stays LTR, even when both
 * sit in the same lesson. Text with no letters at all takes `fallback`.
 */
export function detectDir(text: string, fallback: 'ltr' | 'rtl'): 'ltr' | 'rtl' {
  for (const ch of text) {
    if (RTL_CHARS.test(ch)) return 'rtl';
    if (LTR_CHARS.test(ch)) return 'ltr';
  }
  return fallback;
}
