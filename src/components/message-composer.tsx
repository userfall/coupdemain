"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";

type MessageComposerProps = {
  conversationId: string;
};

export function MessageComposer({ conversationId }: MessageComposerProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setError(payload?.error ?? "Impossible d'envoyer le message.");
        return;
      }

      setContent("");
      router.refresh();
    });
  }

  return (
    <form className="space-y-3 border-t border-line px-6 py-5" onSubmit={handleSubmit}>
      <textarea
        rows={3}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Ecris ton message..."
        className="w-full rounded-[1.2rem] border border-line bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-brand/40 focus:bg-white"
      />
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Envoi..." : "Envoyer"}
        </button>
      </div>
    </form>
  );
}
