import { NextResponse } from "next/server";
import {
  applySessionCookie,
  createSession,
  createUser,
  findUserByEmail,
} from "@/lib/server/auth";
import { saveImageFile } from "@/lib/server/uploads";

export async function POST(request: Request) {
  const formData = await request.formData();

  const displayName = String(formData.get("displayName") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const acceptTerms = String(formData.get("acceptTerms") ?? "") === "true";
  const rememberMe = String(formData.get("rememberMe") ?? "") !== "false";
  const avatarFile =
    formData.get("avatar") instanceof File ? (formData.get("avatar") as File) : null;

  if (displayName.length < 2) {
    return NextResponse.json(
      { error: "Merci d'indiquer un prenom ou un nom." },
      { status: 400 },
    );
  }

  if (city.length < 2) {
    return NextResponse.json(
      { error: "Merci d'indiquer une ville." },
      { status: 400 },
    );
  }

  if (!email.includes("@")) {
    return NextResponse.json(
      { error: "Merci d'indiquer un email valide." },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Le mot de passe doit contenir au moins 8 caracteres." },
      { status: 400 },
    );
  }

  if (!acceptTerms) {
    return NextResponse.json(
      { error: "Merci d'accepter les regles de confiance." },
      { status: 400 },
    );
  }

  if (await findUserByEmail(email)) {
    return NextResponse.json(
      { error: "Un compte existe deja avec cet email." },
      { status: 409 },
    );
  }

  try {
    const avatarPath = await saveImageFile({
      file: avatarFile,
      folder: "avatars",
    });

    const user = await createUser({
      displayName,
      city,
      email,
      password,
      avatarPath,
    });

    const session = await createSession(user.id, rememberMe);
    const response = NextResponse.json({
      ok: true,
      user,
    });

    applySessionCookie(response, session.token, session.expiresAt);

    return response;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Impossible de creer le compte avec cette photo.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
