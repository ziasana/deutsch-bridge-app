jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => void store.set(key, value)),
    deleteItemAsync: jest.fn(async (key: string) => void store.delete(key)),
  };
});

jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn() }));

// Plain in-memory storage (not jest.fn) so tests calling jest.resetAllMocks() keep a working store.
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  const storage = {
    getItem: async (k: string) => store.get(k) ?? null,
    setItem: async (k: string, v: string) => void store.set(k, v),
    removeItem: async (k: string) => void store.delete(k),
    getAllKeys: async () => [...store.keys()],
    multiRemove: async (keys: string[]) => keys.forEach((k) => store.delete(k)),
    clear: async () => store.clear(),
  };
  return { __esModule: true, default: storage };
});

jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({ play() {}, pause() {}, seekTo: async () => {} }),
  useAudioPlayerStatus: () => ({ playing: false, currentTime: 0, duration: 0, isLoaded: false }),
  setAudioModeAsync: async () => {},
}));
