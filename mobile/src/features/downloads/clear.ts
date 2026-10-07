import { outbox } from './outbox';
import { useDownloadsStore } from './store';

/** Sign-out: remove this account's saved content and any progress still waiting to be sent. */
export async function clearDownloads(): Promise<void> {
  await outbox.clear();
  await useDownloadsStore
    .getState()
    .reset()
    .catch(() => undefined);
}
