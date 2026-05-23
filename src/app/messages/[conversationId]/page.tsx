import { notFound } from "next/navigation";
import { LiveConversationView } from "@/components/live-conversation-view";
import { requireUser } from "@/lib/server/auth";
import {
  getConversationForUser,
  getUnreadMessageCount,
  listConversationsForUser,
} from "@/lib/server/messaging";
import type { LiveConversationPayload } from "@/lib/types";

type ConversationPageProps = {
  params: Promise<{
    conversationId: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const { conversationId } = await params;
  const currentUser = await requireUser(
    `/connexion?next=${encodeURIComponent(`/messages/${conversationId}`)}`,
  );
  const conversation = getConversationForUser(conversationId, currentUser.id);

  if (!conversation) {
    notFound();
  }

  const conversations = listConversationsForUser(currentUser.id);
  const payload = {
    conversation,
    conversations,
    unreadCount: getUnreadMessageCount(currentUser.id),
  } satisfies LiveConversationPayload;

  return <LiveConversationView initialData={payload} />;
}
