import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/server/auth";
import { sendMessage } from "@/lib/server/messaging";

type MessageRouteProps = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function POST(request: Request, { params }: MessageRouteProps) {
  const user = await getRequestUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Merci de vous connecter pour continuer cet echange." },
      { status: 401 },
    );
  }

  const body = (await request.json()) as {
    content?: string;
  };
  const { conversationId } = await params;

  try {
    await sendMessage({
      conversationId,
      senderId: user.id,
      content: body.content ?? "",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible d'envoyer le message.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
