"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type SavePostButtonProps = {
  postId: string;
  initialSaved: boolean;
};

export function SavePostButton({
  postId,
  initialSaved,
}: SavePostButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [error, setError] = useState("");

  function handleToggle() {
    setError("");

    startTransition(async () => {
      const response = await fetch(`/api/posts/${postId}/save`, {
        method: "POST",
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; saved?: boolean }
        | null;

      if (!response.ok || typeof payload?.saved !== "boolean") {
        setError(payload?.error ?? "Impossible de mettre cette annonce en favoris.");
        return;
      }

      setIsSaved(payload.saved);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-foreground hover:border-brand/35 hover:text-brand-strong disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending
          ? "Mise a jour..."
          : isSaved
            ? "Retirer des favoris"
            : "Sauvegarder l'annonce"}
      </button>
      {error ? <p className="text-sm text-accent">{error}</p> : null}
    </div>
  );
}
