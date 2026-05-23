import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/server/auth";
import { startConversation } from "@/lib/server/messaging";

export async function POST(request: Request) {
  const user = getRequestUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Merci de vous connecter pour contacter cette annonce." },
      { status: 401 },
    );
  }

  const body = (await request.json()) as {
    postId?: string;
    content?: string;
  };

  try {
    const result = startConversation({
      postId: body.postId?.trim() ?? "",
      senderId: user.id,
      content: body.content ?? "",
    });

    return NextResponse.json({
      ok: true,
      conversationId: result.conversationId,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Impossible de demarrer la conversation.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
