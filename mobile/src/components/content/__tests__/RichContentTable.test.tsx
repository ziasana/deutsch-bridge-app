import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { RichContent } from '../RichContent';

const TABLE = '| Präposition | Akkusativ |\n| --- | --- |\n| in | in das Haus |';

describe('RichContent tables', () => {
  it('keeps the horizontal scroller from growing taller than the table', async () => {
    await render(<RichContent content={TABLE} />);
    const scroller = screen.getByTestId('rich-table-scroll');
    // A default ScrollView grows to fill spare height: that left a tall empty gap under tables in
    // chat answers and made the message list under-measure its content (the end was unreachable).
    expect(StyleSheet.flatten(scroller.props.style).flexGrow).toBe(0);
  });
});
