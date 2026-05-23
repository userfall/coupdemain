import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import type { NextResponse } from "next/server";
import type { SessionUser } from "@/lib/types";
import { DEMO_ACCOUNT, getDatabase } from "@/lib/server/db";
import { ensureSupabaseInitialized } from "@/lib/server/supabase-init";
import {
  isMissingRowError,
  isSupabaseServerConfigured,
  requireSupabaseAdmin,
} from "@/lib/server/supabase-admin";

type UserRow = {
  id: string;
  email: string;
  display_name: string;
  city: string;
  avatar_path: string | null;
  password_hash: string;
  created_at: string;
};

type SessionRow = {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
};

type SessionJoinRow = {
  id: string;
  email: string;
  display_name: string;
  city: string;
  avatar_path: string | null;
  created_at: string;
};

type CreateUserInput = {
  displayName: string;
  city: string;
  email: string;
  password: string;
  avatarPath?: string | null;
};

export const SESSION_COOKIE_NAME = "coupdemain_session";
export { DEMO_ACCOUNT };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapUserRow(row: SessionJoinRow): SessionUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    city: row.city,
    avatarPath: row.avatar_path,
    createdAt: row.created_at,
  };
}

function toSessionUser(row: UserRow) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    city: row.city,
    avatarPath: row.avatar_path,
    createdAt: row.created_at,
  } satisfies SessionUser;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, expectedHash] = storedHash.split(":");

  if (!salt || !expectedHash) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedHash, "hex");
  const candidateBuffer = scryptSync(password, salt, expectedBuffer.length);

  return (
    expectedBuffer.length === candidateBuffer.length &&
    timingSafeEqual(expectedBuffer, candidateBuffer)
  );
}

async function findSupabaseUserByEmail(email: string) {
  await ensureSupabaseInitialized();
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", normalizeEmail(email))
    .maybeSingle<UserRow>();

  if (error && !isMissingRowError(error)) {
    throw new Error(`Impossible de lire le compte: ${error.message}`);
  }

  return data ?? null;
}

export async function findUserByEmail(email: string) {
  if (isSupabaseServerConfigured) {
    return findSupabaseUserByEmail(email);
  }

  const database = getDatabase();

  return (
    database
      .prepare("select * from users where email = ?")
      .get<UserRow>(normalizeEmail(email)) ?? null
  );
}

async function createSupabaseUser(input: CreateUserInput) {
  await ensureSupabaseInitialized();
  const supabase = requireSupabaseAdmin();
  const userId = randomBytes(16).toString("hex");
  const email = normalizeEmail(input.email);
  const createdAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("users")
    .insert({
      id: userId,
      email,
      display_name: input.displayName.trim(),
      city: input.city.trim(),
      avatar_path: input.avatarPath ?? null,
      password_hash: hashPassword(input.password),
      created_at: createdAt,
    })
    .select("*")
    .single<UserRow>();

  if (error) {
    throw new Error(`Impossible de creer le compte: ${error.message}`);
  }

  return toSessionUser(data);
}

export async function createUser(input: CreateUserInput) {
  if (isSupabaseServerConfigured) {
    return createSupabaseUser(input);
  }

  const database = getDatabase();
  const userId = randomBytes(16).toString("hex");
  const email = normalizeEmail(input.email);
  const createdAt = new Date().toISOString();

  database
    .prepare(`
      insert into users (id, email, display_name, city, avatar_path, password_hash, created_at)
      values (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      userId,
      email,
      input.displayName.trim(),
      input.city.trim(),
      input.avatarPath ?? null,
      hashPassword(input.password),
      createdAt,
    );

  return {
    id: userId,
    email,
    displayName: input.displayName.trim(),
    city: input.city.trim(),
    avatarPath: input.avatarPath ?? null,
    createdAt,
  } satisfies SessionUser;
}

export async function updateUserAvatar(userId: string, avatarPath: string | null) {
  if (isSupabaseServerConfigured) {
    await ensureSupabaseInitialized();
    const { error } = await requireSupabaseAdmin()
      .from("users")
      .update({ avatar_path: avatarPath })
      .eq("id", userId);

    if (error) {
      throw new Error(`Impossible de mettre a jour l'avatar: ${error.message}`);
    }

    return;
  }

  const database = getDatabase();

  database
    .prepare("update users set avatar_path = ? where id = ?")
    .run(avatarPath, userId);
}

async function createSupabaseSession(userId: string, remember = true) {
  await ensureSupabaseInitialized();
  const supabase = requireSupabaseAdmin();
  const token = randomBytes(32).toString("hex");
  const sessionLifetimeDays = remember ? 30 : 7;
  const expiresAt = new Date(
    Date.now() + sessionLifetimeDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { error } = await supabase.from("sessions").insert({
    id: token,
    user_id: userId,
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Impossible de creer la session: ${error.message}`);
  }

  return { token, expiresAt };
}

export async function createSession(userId: string, remember = true) {
  if (isSupabaseServerConfigured) {
    return createSupabaseSession(userId, remember);
  }

  const database = getDatabase();
  const token = randomBytes(32).toString("hex");
  const sessionLifetimeDays = remember ? 30 : 7;
  const expiresAt = new Date(
    Date.now() + sessionLifetimeDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  database
    .prepare(`
      insert into sessions (id, user_id, expires_at, created_at)
      values (?, ?, ?, ?)
    `)
    .run(token, userId, expiresAt, new Date().toISOString());

  return { token, expiresAt };
}

export async function deleteSession(token: string) {
  if (isSupabaseServerConfigured) {
    await ensureSupabaseInitialized();
    const { error } = await requireSupabaseAdmin()
      .from("sessions")
      .delete()
      .eq("id", token);

    if (error) {
      throw new Error(`Impossible de supprimer la session: ${error.message}`);
    }

    return;
  }

  const database = getDatabase();
  database.prepare("delete from sessions where id = ?").run(token);
}

async function getSupabaseUserFromSessionToken(token: string | null | undefined) {
  if (!token) {
    return null;
  }

  await ensureSupabaseInitialized();
  const supabase = requireSupabaseAdmin();
  const now = new Date().toISOString();

  await supabase.from("sessions").delete().lte("expires_at", now);

  const { data: sessionRow, error: sessionError } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", token)
    .gt("expires_at", now)
    .maybeSingle<SessionRow>();

  if (sessionError && !isMissingRowError(sessionError)) {
    throw new Error(`Impossible de lire la session: ${sessionError.message}`);
  }

  if (!sessionRow) {
    return null;
  }

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id, email, display_name, city, avatar_path, created_at")
    .eq("id", sessionRow.user_id)
    .maybeSingle<SessionJoinRow>();

  if (userError && !isMissingRowError(userError)) {
    throw new Error(`Impossible de charger l'utilisateur: ${userError.message}`);
  }

  return userRow ? mapUserRow(userRow) : null;
}

export async function getUserFromSessionToken(token: string | null | undefined) {
  if (isSupabaseServerConfigured) {
    return getSupabaseUserFromSessionToken(token);
  }

  if (!token) {
    return null;
  }

  const database = getDatabase();
  const now = new Date().toISOString();

  database.prepare("delete from sessions where expires_at <= ?").run(now);

  const row = database
    .prepare(`
      select users.id, users.email, users.display_name, users.city, users.avatar_path, users.created_at
      from sessions
      join users on users.id = sessions.user_id
      where sessions.id = ? and sessions.expires_at > ?
      limit 1
    `)
    .get<SessionJoinRow>(token, now);

  return row ? mapUserRow(row) : null;
}

export function getSessionTokenFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  return (
    cookieHeader
      .split(";")
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith(`${SESSION_COOKIE_NAME}=`))
      ?.split("=")[1] ?? null
  );
}

export async function getRequestUser(request: Request) {
  return getUserFromSessionToken(getSessionTokenFromRequest(request));
}

export async function getCurrentUser() {
  noStore();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  return getUserFromSessionToken(token);
}

export async function requireUser(redirectTarget = "/connexion") {
  const user = await getCurrentUser();

  if (!user) {
    redirect(redirectTarget);
  }

  return user;
}

export function applySessionCookie(
  response: NextResponse,
  token: string,
  expiresAt: string,
) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
