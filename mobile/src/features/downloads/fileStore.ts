import { Directory, File, Paths } from 'expo-file-system';

/**
 * The only module that touches the native file system, so the rest of the downloads feature (and
 * its tests) deal in plain relative paths. Everything lives under <documents>/downloads, which is
 * not cleared by the OS like the cache directory.
 */
const root = () => new Directory(Paths.document, 'downloads');

function ensureDir(dir: Directory): void {
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
}

function fileAt(path: string): File {
  const parts = path.split('/');
  const name = parts.pop() as string;
  const dir = parts.length ? new Directory(root(), ...parts) : root();
  ensureDir(dir);
  return new File(dir, name);
}

export const fileStore = {
  async readText(path: string): Promise<string | null> {
    const file = fileAt(path);
    return file.exists ? file.text() : null;
  },

  async writeText(path: string, text: string): Promise<void> {
    const file = fileAt(path);
    if (!file.exists) file.create({ intermediates: true });
    file.write(text);
  },

  /** Saves a remote file; returns the local `file://` uri and its size in bytes. */
  async download(url: string, path: string): Promise<{ uri: string; bytes: number }> {
    const target = fileAt(path);
    const saved = await File.downloadFileAsync(url, target, { idempotent: true });
    return { uri: saved.uri, bytes: saved.size ?? 0 };
  },

  /** Removes a folder and everything in it (an item's images). */
  async removeDir(path: string): Promise<void> {
    const dir = new Directory(root(), ...path.split('/'));
    if (dir.exists) dir.delete();
  },

  async remove(path: string): Promise<void> {
    const file = fileAt(path);
    if (file.exists) file.delete();
  },

  async removeAll(): Promise<void> {
    const dir = root();
    if (dir.exists) dir.delete();
  },
};
