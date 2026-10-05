import AsyncStorage from '@react-native-async-storage/async-storage';
import { WRITING_DRAFT_PREFIX } from './writing/draft';
import { useExamTimerStore } from './time/timerStore';

/** Removes what exam practice keeps on the device (unsent writing drafts, the running timer) — called on sign-out. */
export async function clearExamLocalData(): Promise<void> {
  useExamTimerStore.setState({ active: null, lastResult: null });
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(WRITING_DRAFT_PREFIX));
    if (keys.length > 0) await AsyncStorage.multiRemove(keys);
  } catch {
    /* storage unavailable: nothing was stored either */
  }
}
