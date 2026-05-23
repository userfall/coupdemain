"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        startTransition(async () => {
          await fetch("/api/auth/logout", {
            method: "POST",
          });
          router.replace("/");
          router.refresh();
        });
      }}
      className="rounded-full border border-line bg-white px-4 py-2.5 text-sm font-semibold text-foreground hover:-translate-y-0.5 hover:border-brand/30 hover:text-brand-strong"
    >
      {isPending ? "Deconnexion..." : "Se deconnecter"}
    </button>
  );
}
