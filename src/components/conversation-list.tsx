import Link from "next/link";
import { UserAvatar } from "@/components/user-avatar";
import type { ConversationSummary } from "@/lib/types";

type ConversationListProps = {
  conversations: ConversationSummary[];
  selectedConversationId?: string;
};

export function ConversationList({
  conversations,
  selectedConversationId,
}: ConversationListProps) {
  return (
    <div className="space-y-3">
      {conversations.map((conversation) => {
        const isActive = conversation.id === selectedConversationId;

        return (
          <Link
            key={conversation.id}
            href={`/messages/${conversation.id}`}
            className={`block rounded-[1.5rem] border px-4 py-4 transition ${
              isActive
                ? "border-brand/30 bg-brand-soft/60"
                : "border-line bg-white/85 hover:border-brand/20 hover:bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <UserAvatar
                  name={conversation.otherUserName}
                  avatarPath={conversation.otherUserAvatarPath}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {conversation.otherUserName}
                  </p>
                  <p className="text-xs text-muted">{conversation.otherUserCity}</p>
                </div>
              </div>
              {conversation.unreadCount > 0 ? (
                <span className="rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-white">
                  {conversation.unreadCount}
                </span>
              ) : null}
            </div>
            <p className="mt-3 line-clamp-1 text-sm font-semibold text-foreground">
              {conversation.postTitle}
            </p>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
              {conversation.lastMessagePreview || "Aucun message pour le moment."}
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted">
              {conversation.lastMessageAtLabel}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
