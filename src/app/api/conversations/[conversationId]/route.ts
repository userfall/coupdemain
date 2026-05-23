import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/server/auth";
import { getUnreadMessageCount, listConversationsForUser, peekConversationForUser } from "@/lib/server/messaging";
import type { LiveConversationPayload } from "@/lib/types";

type ConversationRouteProps = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function GET(request: Request, { params }: ConversationRouteProps) {
  const user = await getRequestUser(request);

  if (!user) {
    return NextResponse.json({ error: "Non authentifie." }, { status: 401 });
  }

  const { conversationId } = await params;
  const conversation = await peekConversationForUser(conversationId, user.id);

  if (!conversation) {
    return NextResponse.json({ error: "Conversation introuvable." }, { status: 404 });
  }

  const payload = {
    conversation,
    conversations: await listConversationsForUser(user.id),
    unreadCount: await getUnreadMessageCount(user.id),
  } satisfies LiveConversationPayload;

  return NextResponse.json(payload);
}
