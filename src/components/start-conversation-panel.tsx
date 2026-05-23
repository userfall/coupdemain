"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";

type StartConversationPanelProps = {
  postId: string;
  existingConversationId: string | null;
  isAuthenticated: boolean;
  loginHref: string;
};

export function StartConversationPanel({
  postId,
  existingConversationId,
  isAuthenticated,
  loginHref,
}: StartConversationPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState(
    "Bonjour, ton annonce m'interesse. Est-ce toujours disponible ?",
  );
  const [error, setError] = useState("");

  if (!isAuthenticated) {
    return (
      <div className="rounded-[1.5rem] bg-white/85 p-4">
        <p className="text-sm font-semibold text-foreground">
          Connecte-toi pour contacter cette personne.
        </p>
        <p className="mt-2 text-sm leading-6 text-muted">
          Les coordonnees restent masquees tant que l&apos;echange n&apos;a pas
          commence dans la messagerie.
        </p>
        <Link
          href={loginHref}
          className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-strong"
        >
          Me connecter
        </Link>
      </div>
    );
  }

  if (existingConversationId) {
    return (
      <div className="rounded-[1.5rem] bg-white/85 p-4">
        <p className="text-sm font-semibold text-foreground">
          Une conversation existe deja pour cette annonce.
        </p>
        <p className="mt-2 text-sm leading-6 text-muted">
          Reprends l&apos;echange sans exposer ton email ou ton numero au public.
        </p>
        <Link
          href={`/messages/${existingConversationId}`}
          className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-strong"
        >
          Ouvrir la conversation
        </Link>
      </div>
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          content: message,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; conversationId?: string }
        | null;

      if (!response.ok || !payload?.conversationId) {
        setError(payload?.error ?? "Impossible de demarrer la conversation.");
        return;
      }

      router.push(`/messages/${payload.conversationId}`);
      router.refresh();
    });
  }

  return (
    <form className="space-y-3 rounded-[1.5rem] bg-white/85 p-4" onSubmit={handleSubmit}>
      <div>
        <p className="text-sm font-semibold text-foreground">
          Contacter via la messagerie
        </p>
        <p className="mt-2 text-sm leading-6 text-muted">
          Les premiers echanges restent dans l&apos;app. Les coordonnees privees
          ne s&apos;affichent pas publiquement.
        </p>
      </div>
      <textarea
        rows={4}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        className="w-full rounded-[1.2rem] border border-line bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-brand/40 focus:bg-white"
      />
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Envoi..." : "Envoyer le premier message"}
      </button>
    </form>
  );
}
