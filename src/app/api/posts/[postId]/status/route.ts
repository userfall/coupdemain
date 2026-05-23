import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/server/auth";
import { updatePostStatus } from "@/lib/server/marketplace";
import type { PostStatus } from "@/lib/types";

type StatusRouteProps = {
  params: Promise<{
    postId: string;
  }>;
};

function isPostStatus(value: string): value is PostStatus {
  return value === "open" || value === "matched" || value === "resolved";
}

export async function POST(request: Request, { params }: StatusRouteProps) {
  const user = getRequestUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Merci de vous connecter pour gerer cette annonce." },
      { status: 401 },
    );
  }

  const body = (await request.json()) as {
    status?: string;
  };
  const { postId } = await params;
  const nextStatus = body.status ?? "";

  if (!isPostStatus(nextStatus)) {
    return NextResponse.json(
      { error: "Statut non reconnu." },
      { status: 400 },
    );
  }

  try {
    updatePostStatus(user.id, postId, nextStatus);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible de changer le statut.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
