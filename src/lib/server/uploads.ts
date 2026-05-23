import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import {
  getMediaDirectory,
  getMediaPublicPath,
  type MediaFolder,
} from "@/lib/server/storage";
import {
  getSupabasePublicUrl,
  getSupabaseStorageBucket,
  isSupabaseServerConfigured,
  requireSupabaseAdmin,
} from "@/lib/server/supabase-admin";

type UploadOptions = {
  file: File | null;
  folder: MediaFolder;
  maxSizeInMb?: number;
};

export async function saveImageFile({
  file,
  folder,
  maxSizeInMb = 5,
}: UploadOptions) {
  if (!file || file.size === 0) {
    return null;
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Merci d'ajouter une image valide.");
  }

  if (file.size > maxSizeInMb * 1024 * 1024) {
    throw new Error(`L'image doit faire moins de ${maxSizeInMb} Mo.`);
  }

  const directory = getMediaDirectory(folder);
  await mkdir(directory, { recursive: true });

  const fallbackExtension = file.type.split("/")[1] || "jpg";
  const extension = extname(file.name).replace(".", "") || fallbackExtension;
  const filename = `${Date.now()}-${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (isSupabaseServerConfigured) {
    const path = `${folder}/${filename}`;
    const { error } = await requireSupabaseAdmin().storage
      .from(getSupabaseStorageBucket())
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      throw new Error(`Impossible d'envoyer l'image dans Supabase: ${error.message}`);
    }

    return getSupabasePublicUrl(path);
  }

  const filePath = join(directory, filename);
  await writeFile(filePath, buffer);

  return getMediaPublicPath(folder, filename);
}
