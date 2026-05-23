import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { NextResponse } from "next/server";
import {
  getMediaDirectory,
  MEDIA_FOLDERS,
  type MediaFolder,
} from "@/lib/server/storage";

const MIME_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function isMediaFolder(value: string): value is MediaFolder {
  return MEDIA_FOLDERS.includes(value as MediaFolder);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ folder: string; filename: string }> },
) {
  const { folder, filename } = await context.params;

  if (!isMediaFolder(folder) || basename(filename) !== filename) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  try {
    const filePath = getMediaDirectory(folder);
    const file = await readFile(`${filePath}/${filename}`);
    const extension = extname(filename).toLowerCase();
    const contentType = MIME_TYPES[extension] ?? "application/octet-stream";

    return new NextResponse(file, {
      headers: {
        "cache-control": "public, max-age=31536000, immutable",
        "content-type": contentType,
      },
    });
  } catch {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }
}
