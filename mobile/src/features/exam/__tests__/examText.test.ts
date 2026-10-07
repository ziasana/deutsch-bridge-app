import { localizeExamText } from '../examText';

describe('localizeExamText', () => {
  it('translates the fixed exam vocabulary for English learners', () => {
    expect(localizeExamText('Teil 1 – Zuordnungsaufgaben', 'en')).toBe('Part 1 – Matching tasks');
    expect(localizeExamText('Sprachbausteine Teil 2', 'en')).toBe('Language elements Part 2');
    expect(localizeExamText('Hörverstehen: 3. Übung', 'en')).toBe('Listening: Exercise 3');
    expect(localizeExamText('Lesen', 'en')).toBe('Reading');
    expect(localizeExamText('Schreiben', 'en')).toBe('Writing');
    expect(localizeExamText('Schriftlicher Ausdruck', 'en')).toBe('Written expression');
    expect(localizeExamText('Testformat', 'en')).toBe('Test format');
  });

  it('keeps free-text titles and longer words intact in English too', () => {
    expect(localizeExamText('E-Mail an den Vermieter', 'en')).toBe('E-Mail an den Vermieter');
    expect(localizeExamText('Vorlesen üben', 'en')).toBe('Vorlesen üben');
  });

  it('translates the fixed exam vocabulary for Persian learners', () => {
    expect(localizeExamText('Teil 1 – Zuordnungsaufgaben', 'fa')).toBe('بخش 1 – تکالیف تطبیق');
    expect(localizeExamText('Sprachbausteine Teil 2', 'fa')).toBe('عناصر زبانی بخش 2');
    expect(localizeExamText('Schriftlicher Ausdruck', 'fa')).toBe('بیان نوشتاری');
    expect(localizeExamText('Hörverstehen: 3. Übung', 'fa')).toBe('درک مطلب شنیداری: تمرین 3');
    expect(localizeExamText('Lesen', 'fa')).toBe('خواندن');
    expect(localizeExamText('Schreiben', 'fa')).toBe('نوشتن');
  });

  it('keeps free-text titles and longer words intact', () => {
    expect(localizeExamText('E-Mail an den Vermieter', 'fa')).toBe('E-Mail an den Vermieter');
    // "Lesen" must not be replaced inside another word.
    expect(localizeExamText('Vorlesen üben', 'fa')).toBe('Vorlesen üben');
  });
});
