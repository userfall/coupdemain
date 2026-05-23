"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConversationList } from "@/components/conversation-list";
import { MessageComposer } from "@/components/message-composer";
import { UserAvatar } from "@/components/user-avatar";
import type { LiveConversationPayload } from "@/lib/types";

type LiveConversationViewProps = {
  initialData: LiveConversationPayload;
};

export function LiveConversationView({
  initialData,
}: LiveConversationViewProps) {
  const [data, setData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function refreshConversation() {
      setIsRefreshing(true);

      try {
        const response = await fetch(`/api/conversations/${data.conversation.id}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as LiveConversationPayload;

        if (!cancelled) {
          setData(payload);
        }
      } finally {
        if (!cancelled) {
          setIsRefreshing(false);
        }
      }
    }

    const interval = window.setInterval(refreshConversation, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [data.conversation.id]);

  const conversation = data.conversation;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[2rem] border border-line bg-white/92 p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              Messagerie
            </p>
            <h1 className="mt-3 font-serif text-4xl text-foreground">
              Conversations en cours
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              {data.unreadCount} message{data.unreadCount > 1 ? "s" : ""} non lu
              {data.unreadCount > 1 ? "s" : ""} dans ton espace.
            </p>
          </div>
          <Link
            href="/annonces"
            className="text-sm font-semibold text-brand hover:text-brand-strong"
          >
            Voir les annonces
          </Link>
        </div>
        <div className="mt-6">
          <ConversationList
            conversations={data.conversations}
            selectedConversationId={conversation.id}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-line bg-white/94">
        <div className="border-b border-line bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,248,239,0.96))] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
                Discussion privee
              </p>
              <div className="mt-3 flex items-center gap-4">
                <UserAvatar
                  name={conversation.otherUserName}
                  avatarPath={conversation.otherUserAvatarPath}
                  size="lg"
                />
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">
                    {conversation.otherUserName}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    A propos de l&apos;annonce{" "}
                    <Link
                      href={`/annonces/${conversation.postSlug}`}
                      className="font-semibold text-brand hover:text-brand-strong"
                    >
                      {conversation.postTitle}
                    </Link>
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              {isRefreshing ? "Synchro..." : "A jour"}
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-[linear-gradient(180deg,rgba(255,248,239,0.35),rgba(255,255,255,0.92))] px-6 py-5">
          {conversation.messages.length > 0 ? (
            conversation.messages.map((message) => (
              <article
                key={message.id}
                className={`max-w-[85%] rounded-[1.5rem] px-4 py-3 shadow-sm ${
                  message.fromCurrentUser
                    ? "ml-auto bg-brand text-white"
                    : "border border-line bg-white text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserAvatar
                    name={message.senderName}
                    avatarPath={message.senderAvatarPath}
                    size="sm"
                  />
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
                    {message.fromCurrentUser ? "Toi" : message.senderName}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-7">{message.content}</p>
                <p className="mt-2 text-xs opacity-70">{message.createdAtLabel}</p>
              </article>
            ))
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-line bg-white/80 px-5 py-6 text-center">
              <p className="text-sm text-muted">
                Aucun message pour le moment dans cette conversation.
              </p>
            </div>
          )}
        </div>

        <MessageComposer conversationId={conversation.id} />
      </section>
    </div>
  );
}
