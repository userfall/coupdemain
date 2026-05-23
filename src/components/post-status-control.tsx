"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { PostStatus } from "@/lib/types";

type PostStatusControlProps = {
  postId: string;
  initialStatus: PostStatus;
};

export function PostStatusControl({
  postId,
  initialStatus,
}: PostStatusControlProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleChange(nextStatus: PostStatus) {
    const previousStatus = status;
    setStatus(nextStatus);
    setError("");

    startTransition(async () => {
      const response = await fetch(`/api/posts/${postId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setStatus(previousStatus);
        setError(payload?.error ?? "Impossible de changer le statut.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-[1.5rem] bg-white/85 p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">
          Gerer le statut de l&apos;annonce
        </p>
        <p className="mt-2 text-sm leading-6 text-muted">
          Fais evoluer l&apos;annonce au fil de l&apos;echange pour rassurer les
          autres membres.
        </p>
      </div>
      <select
        value={status}
        onChange={(event) => handleChange(event.target.value as PostStatus)}
        disabled={isPending}
        className="w-full rounded-[1.2rem] border border-line bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-brand/40 focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        <option value="open">Ouverte</option>
        <option value="matched">En cours</option>
        <option value="resolved">Resolue</option>
      </select>
      {error ? <p className="text-sm text-accent">{error}</p> : null}
    </div>
  );
}
