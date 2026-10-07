export type DownloadKind = 'grammar' | 'reading';

/** What the Downloads list shows; the content itself lives in its own file. */
export interface DownloadMeta {
  kind: DownloadKind;
  id: string;
  title: string;
  level: string;
  /** Bytes of the stored content, for the storage summary. */
  bytes: number;
  /** Bytes of the images saved with it (reading covers). */
  imageBytes?: number;
  downloadedAt: string;
}

export const downloadKey = (kind: DownloadKind, id: string) => `${kind}:${id}`;
