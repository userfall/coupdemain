"use client";

import Image from "next/image";
import { type FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/user-avatar";
import type { SessionUser } from "@/lib/types";

type ProfileAvatarFormProps = {
  currentUser: SessionUser;
};

export function ProfileAvatarForm({ currentUser }: ProfileAvatarFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!file) {
      setError("Choisis une photo avant d'enregistrer.");
      return;
    }

    startTransition(async () => {
      const payload = new FormData();
      payload.set("avatar", file);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: payload,
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setError(data?.error ?? "Impossible d'enregistrer la photo.");
        return;
      }

      router.refresh();
      setFile(null);
      setPreviewUrl(null);
    });
  }

  return (
    <form
      className="space-y-4 rounded-[1.5rem] border border-line bg-surface p-5"
      onSubmit={handleSubmit}
    >
      <div className="flex items-center gap-4">
        {previewUrl ? (
          <div className="relative h-24 w-24 overflow-hidden rounded-full border border-line">
            <Image
              src={previewUrl}
              alt="Apercu de la photo de profil"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <UserAvatar
            name={currentUser.displayName}
            avatarPath={currentUser.avatarPath}
            size="xl"
          />
        )}
        <div>
          <p className="text-lg font-semibold text-foreground">
            Photo de profil
          </p>
          <p className="mt-1 text-sm leading-6 text-muted">
            Une photo claire rend ton profil plus credible dans les annonces et les messages.
          </p>
        </div>
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={(event) => {
          const nextFile = event.target.files?.[0] ?? null;
          setFile(nextFile);
          setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
        }}
        className="rounded-[1.2rem] border border-dashed border-line bg-white px-4 py-3 font-normal text-sm text-muted outline-none file:mr-4 file:rounded-full file:border-0 file:bg-brand-soft file:px-4 file:py-2 file:font-semibold file:text-brand-strong"
      />

      {error ? (
        <div className="rounded-[1.2rem] border border-accent/20 bg-accent-soft p-4 text-sm text-accent">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Enregistrement..." : "Mettre a jour la photo"}
      </button>
    </form>
  );
}
