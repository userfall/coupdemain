import { NextResponse } from "next/server";
import { getRequestUser, updateUserAvatar } from "@/lib/server/auth";
import { saveImageFile } from "@/lib/server/uploads";

export async function POST(request: Request) {
  const user = getRequestUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Merci de vous connecter pour modifier votre profil." },
      { status: 401 },
    );
  }

  const formData = await request.formData();
  const avatarFile =
    formData.get("avatar") instanceof File ? (formData.get("avatar") as File) : null;

  try {
    const avatarPath = await saveImageFile({
      file: avatarFile,
      folder: "avatars",
    });

    if (!avatarPath) {
      return NextResponse.json(
        { error: "Aucune image n'a ete recue." },
        { status: 400 },
      );
    }

    updateUserAvatar(user.id, avatarPath);

    return NextResponse.json({ ok: true, avatarPath });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Impossible d'enregistrer la photo de profil.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
