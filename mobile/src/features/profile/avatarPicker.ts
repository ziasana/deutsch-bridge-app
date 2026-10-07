import * as ImagePicker from 'expo-image-picker';
import type { AvatarFile } from '@/api/userApi';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export class UnsupportedImageError extends Error {}

/** Opens the photo library with a square crop; resolves null when the learner cancels. */
export async function pickAvatar(): Promise<AvatarFile | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0];
  const type = asset.mimeType ?? 'image/jpeg';
  if (!ALLOWED.includes(type))
    throw new UnsupportedImageError('Bitte wähle ein JPG-, PNG- oder WebP-Bild.');
  const extension = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  return { uri: asset.uri, name: asset.fileName ?? `avatar.${extension}`, type };
}

export function initialsOf(name?: string | null, email?: string | null): string {
  return (name ?? email ?? '?')
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
