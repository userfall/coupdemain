import { join } from "node:path";

export const MEDIA_FOLDERS = ["uploads", "avatars"] as const;

export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

function getStorageRootOverride() {
  const value = process.env.APP_STORAGE_ROOT?.trim();
  return value ? value : null;
}

export function getDatabaseDirectory() {
  const storageRoot = getStorageRootOverride();
  return storageRoot ? join(storageRoot, "data") : join(process.cwd(), "data");
}

export function getMediaDirectory(folder: MediaFolder) {
  const storageRoot = getStorageRootOverride();

  return storageRoot
    ? join(storageRoot, "media", folder)
    : join(process.cwd(), "public", folder);
}

export function getMediaPublicPath(folder: MediaFolder, filename: string) {
  return `/media/${folder}/${filename}`;
}
