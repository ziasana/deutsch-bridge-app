import { Ionicons } from '@expo/vector-icons';
import type { ExamSection } from '@/types/exam';
import { AppText } from '@/components/ui';
import { SECTION_META } from '../examMeta';

/** Sections whose emoji is multicoloured and clashes with the section colour get a solid icon in it instead. */
const SOLID_ICON: Partial<Record<ExamSection, keyof typeof Ionicons.glyphMap>> = {
  SPRACHBAUSTEINE: 'extension-puzzle',
  SCHRIFTLICHER_AUSDRUCK: 'create',
};

/** The section's icon: a solid icon in the section colour where it has one, otherwise its emoji. */
export function SectionIcon({ section, size }: { section: ExamSection; size: number }) {
  const meta = SECTION_META[section];
  const icon = SOLID_ICON[section];
  if (icon) {
    return (
      <Ionicons
        name={icon}
        size={Math.round(size * 0.95)}
        color={meta.color}
        accessibilityElementsHidden
      />
    );
  }
  return (
    <AppText
      style={{ fontSize: size, lineHeight: Math.round(size * 1.28) }}
      accessibilityElementsHidden
    >
      {meta.emoji}
    </AppText>
  );
}
