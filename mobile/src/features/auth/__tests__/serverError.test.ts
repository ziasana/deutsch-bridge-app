import { ApiError } from '@/api/errors';
import { authErrorMessage } from '../serverError';

const m = { network: 'NET', server: 'SERVER', mailUnavailable: 'MAIL' };

describe('authErrorMessage', () => {
  it('shows nothing without an error', () => {
    expect(authErrorMessage(null, m)).toBeUndefined();
  });

  it('explains a mail failure on sign-up (503), but not elsewhere', () => {
    const error = new ApiError('server', 'x', 503);
    expect(authErrorMessage(error, m)).toBe('MAIL');
    expect(authErrorMessage(error, m, false)).toBe('SERVER');
  });

  it('localizes connection and server problems instead of the German fallback', () => {
    expect(authErrorMessage(new ApiError('network', 'Keine Verbindung'), m)).toBe('NET');
    expect(authErrorMessage(new ApiError('server', 'Der Server ...', 500), m)).toBe('SERVER');
  });

  it('keeps messages the backend wrote for the user', () => {
    expect(authErrorMessage(new ApiError('validation', 'Email already registered', 409), m)).toBe(
      'Email already registered',
    );
  });
});
