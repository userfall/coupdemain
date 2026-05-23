import { NextResponse } from "next/server";
import {
  applySessionCookie,
  createSession,
  findUserByEmail,
  verifyPassword,
} from "@/lib/server/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
    rememberMe?: boolean;
  };

  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";
  const user = await findUserByEmail(email);

  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json(
      { error: "Email ou mot de passe incorrect." },
      { status: 401 },
    );
  }

  const session = await createSession(user.id, body.rememberMe !== false);
  const response = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      city: user.city,
      avatarPath: user.avatar_path,
      createdAt: user.created_at,
    },
  });

  applySessionCookie(response, session.token, session.expiresAt);

  return response;
}
