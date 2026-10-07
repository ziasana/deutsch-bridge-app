import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText, BottomSheet, Card, Chip, LoadingState } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type {
  WritingExampleData,
  WritingHelpTab,
  WritingLearningResponse,
  WritingMistakeData,
  WritingStrategyData,
} from '@/types/writing';
import {
  FORMALITY_LABELS,
  HELP_TAB_LABELS,
  helpTabHasContent,
  itemsOfKind,
  phraseCategoryLabels,
} from '../writingMeta';
import { Expandable } from './Expandable';
import { WRITING_COLOR } from '@/features/exam/writing/learn/ui';
import { darken } from '@/features/exam/components/kit';

function Strategy({ data }: { data: WritingLearningResponse }) {
  const steps = itemsOfKind<WritingStrategyData>(data, 'STRATEGY_STEP');
  return (
    <View style={{ gap: spacing.sm }}>
      {steps.map((s, i) => (
        <Expandable key={s.id} title={`${i + 1}. ${s.title}`} defaultOpen={i === 0}>
          {s.content ? <AppText>{s.content}</AppText> : null}
          {(s.data?.tips ?? []).map((t) => (
            <AppText key={t}>• {t}</AppText>
          ))}
        </Expandable>
      ))}
    </View>
  );
}

function Example({ data }: { data: WritingLearningResponse }) {
  const items = itemsOfKind<WritingExampleData>(data, 'EXAMPLE');
  const [view, setView] = useState<'full' | 'analyze'>('full');
  const [activeKey, setActiveKey] = useState<Record<string, string>>({});
  return (
    <View style={{ gap: spacing.lg }}>
      {items.map((item) => {
        const sections = item.data?.sections ?? [];
        const active = sections.find((s) => s.key === activeKey[item.id]) ?? sections[0];
        return (
          <Card key={item.id} style={{ gap: spacing.md }}>
            <AppText variant="subheading">{item.title}</AppText>
            {item.content ? <AppText color={colors.mutedForeground}>{item.content}</AppText> : null}
            <View style={styles.row}>
              <Chip label="Vollständiger Text" selected={view === 'full'} onPress={() => setView('full')} color={darken(WRITING_COLOR)} />
              <Chip label="Text analysieren" selected={view === 'analyze'} onPress={() => setView('analyze')} color={darken(WRITING_COLOR)} />
            </View>
            {view === 'full' ? (
              <AppText>{sections.map((s) => s.text).join('\n\n')}</AppText>
            ) : (
              <View style={{ gap: spacing.sm }}>
                <View style={styles.row}>
                  {sections.map((s) => (
                    <Chip
                      key={s.key}
                      label={s.label}
                      selected={active?.key === s.key}
                      onPress={() => setActiveKey((m) => ({ ...m, [item.id]: s.key }))}
                      color={darken(WRITING_COLOR)}
                    />
                  ))}
                </View>
                {active ? (
                  <View style={{ gap: spacing.sm }}>
                    <AppText style={styles.quote}>{active.text}</AppText>
                    {active.why ? (
                      <>
                        <AppText variant="subheading">Warum ist das wichtig?</AppText>
                        <AppText>{active.why}</AppText>
                      </>
                    ) : null}
                    {active.phrases?.length ? (
                      <>
                        <AppText variant="subheading">Passende Redemittel:</AppText>
                        {active.phrases.map((p) => (
                          <AppText key={p}>• {p}</AppText>
                        ))}
                      </>
                    ) : null}
                  </View>
                ) : null}
              </View>
            )}
          </Card>
        );
      })}
    </View>
  );
}

function Phrases({ data }: { data: WritingLearningResponse }) {
  const labels = useMemo(() => phraseCategoryLabels(data.phrases), [data.phrases]);
  const categories = Object.keys(labels);
  const [selected, setSelected] = useState<string | null>(null);
  const current = selected && categories.includes(selected) ? selected : categories[0];
  const shown = data.phrases.filter((p) => p.category === current).sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <View style={{ gap: spacing.md }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {categories.map((c) => (
          <Chip key={c} label={labels[c]} selected={c === current} onPress={() => setSelected(c)} color={darken(WRITING_COLOR)} />
        ))}
      </ScrollView>
      {shown.map((p) => (
        <Card key={p.id} style={{ gap: spacing.xs }}>
          <AppText style={{ fontWeight: '700' }}>
            • {p.phrase}
            {p.formality ? (
              <AppText variant="small" color={colors.mutedForeground}>
                {'  '}({FORMALITY_LABELS[p.formality]})
              </AppText>
            ) : null}
          </AppText>
          {p.explanation ? (
            <AppText variant="small" color={colors.mutedForeground}>
              {p.explanation}
            </AppText>
          ) : null}
          {p.example ? <AppText style={{ fontStyle: 'italic' }}>z. B. {p.example}</AppText> : null}
          {p.usageNote ? (
            <AppText variant="small" color={colors.mutedForeground}>
              Hinweis: {p.usageNote}
            </AppText>
          ) : null}
        </Card>
      ))}
    </View>
  );
}

function Mistakes({ data }: { data: WritingLearningResponse }) {
  const items = itemsOfKind<WritingMistakeData>(data, 'MISTAKE');
  return (
    <View style={{ gap: spacing.sm }}>
      {items.map((m, i) => (
        <Expandable key={m.id} title={`Fehler ${i + 1} – ${m.title}`}>
          {m.content ? <AppText>{m.content}</AppText> : null}
          {m.data?.wrong ? (
            <AppText style={[styles.wrong]}>✕ {m.data.wrong}</AppText>
          ) : null}
          {m.data?.right ? (
            <AppText style={[styles.right]}>✓ {m.data.right}</AppText>
          ) : null}
        </Expandable>
      ))}
    </View>
  );
}

type Props = {
  visible: boolean;
  onClose: () => void;
  tabs: WritingHelpTab[];
  data: WritingLearningResponse | undefined;
  loading: boolean;
};

/** Contextual writing help in a bottom sheet; the editor stays mounted behind it, so nothing typed is lost. */
export function HelpSheet({ visible, onClose, tabs, data, loading }: Props) {
  const [tab, setTab] = useState<WritingHelpTab | null>(null);
  const current = tab && tabs.includes(tab) ? tab : tabs[0];
  if (tabs.length === 0) return null;

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Hilfe">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {tabs.map((t) => (
          <Chip key={t} label={HELP_TAB_LABELS[t]} selected={t === current} onPress={() => setTab(t)} color={darken(WRITING_COLOR)} />
        ))}
      </ScrollView>
      {loading ? (
        <LoadingState label="Hilfe wird geladen …" />
      ) : !data ? (
        <AppText color={colors.mutedForeground}>Hilfe ist gerade nicht verfügbar.</AppText>
      ) : !helpTabHasContent(data, current) ? (
        <AppText color={colors.mutedForeground}>Für dieses Niveau gibt es hier noch keine Inhalte.</AppText>
      ) : (
        <>
          {current === 'TIP' ? <Strategy data={data} /> : null}
          {current === 'EXAMPLE' ? <Example data={data} /> : null}
          {current === 'PHRASES' ? <Phrases data={data} /> : null}
          {current === 'MISTAKES' ? <Mistakes data={data} /> : null}
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quote: { borderLeftWidth: 4, borderLeftColor: colors.primary, paddingLeft: spacing.md },
  wrong: { backgroundColor: colors.destructiveSoft, padding: spacing.sm, borderRadius: radius.sm },
  right: { backgroundColor: colors.successSoft, padding: spacing.sm, borderRadius: radius.sm },
});
