import { localizeExamText } from '../examText';

describe('localizeExamText', () => {
  it('leaves German untouched for English learners', () => {
    expect(localizeExamText('Teil 1 – Zuordnungsaufgaben', 'en')).toBe(
      'Teil 1 – Zuordnungsaufgaben',
    );
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
