import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  deleteSession,
  SESSION_COOKIE_NAME,
} from "@/lib/server/auth";

export async function POST(request: Request) {
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.split("=")[1];

  if (token) {
    deleteSession(token);
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);

  return response;
}
