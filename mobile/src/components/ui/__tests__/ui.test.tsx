import { fireEvent, render, screen } from '@testing-library/react-native';
import { ApiError } from '@/api/errors';
import { Button, ErrorState, LearningCelebration, ProgressBar } from '..';

describe('design system', () => {
  it('Button fires onPress and is blocked while loading', async () => {
    const onPress = jest.fn();
    const { rerender } = await render(<Button label="Weiter" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Weiter' }));
    expect(onPress).toHaveBeenCalledTimes(1);

    await rerender(<Button label="Weiter" onPress={onPress} loading />);
    await fireEvent.press(screen.getByRole('button', { name: 'Weiter' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('ProgressBar clamps and exposes accessible value', async () => {
    await render(<ProgressBar value={150} max={100} />);
    expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({ now: 100 });
  });

  it('ErrorState offers retry for network errors only', async () => {
    const onRetry = jest.fn();
    const { rerender } = await render(
      <ErrorState error={new ApiError('network', 'Keine Verbindung.')} onRetry={onRetry} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();

    await rerender(<ErrorState error={new ApiError('notFound', 'Not found.')} onRetry={onRetry} />);
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('LearningCelebration renders message, progress and next actions', async () => {
    const next = jest.fn();
    await render(
      <LearningCelebration
        title="Sehr gut!"
        progress={{ value: 5, max: 5 }}
        progressLabel="5 / 5 Wörter gelernt"
        primaryAction={{ label: 'Noch einmal üben', onPress: next }}
      />,
    );
    expect(screen.getByText('Sehr gut!')).toBeTruthy();
    expect(screen.getByText('5 / 5 Wörter gelernt')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Noch einmal üben' }));
    expect(next).toHaveBeenCalled();
  });
});
