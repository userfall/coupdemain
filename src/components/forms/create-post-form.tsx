"use client";

import Image from "next/image";
import { type FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Category, SessionUser } from "@/lib/types";

type CreatePostFormProps = {
  categories: Category[];
  currentUser: SessionUser;
};

export function CreatePostForm({
  categories,
  currentUser,
}: CreatePostFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    type: "request",
    category: categories[0]?.slug ?? "",
    city: currentUser.city,
    contact: currentUser.email,
    phoneNumber: "",
    availability: "",
    urgent: false,
    tags: "",
  });

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function updateField(name: keyof typeof formState, value: string | boolean) {
    setFormState((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleImageChange(file: File | null) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setImageFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const payload = new FormData();
      payload.set("title", formState.title);
      payload.set("description", formState.description);
      payload.set("type", formState.type);
      payload.set("category", formState.category);
      payload.set("city", formState.city);
      payload.set("contact", formState.contact);
      payload.set("phoneNumber", formState.phoneNumber);
      payload.set("availability", formState.availability);
      payload.set("urgent", String(formState.urgent));
      payload.set("tags", formState.tags);

      if (imageFile) {
        payload.set("image", imageFile);
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        body: payload,
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string; slug?: string }
        | null;

      if (!response.ok || !data?.slug) {
        setError(data?.error ?? "La publication a echoue.");
        return;
      }

      router.push(`/annonces/${data.slug}`);
      router.refresh();
    });
  }

  return (
    <section className="rounded-[2rem] border border-line bg-white/90 p-6">
      <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <h2 className="font-serif text-3xl text-foreground">
              Publier une annonce
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              La publication est reelle : elle sera enregistree dans la base
              locale, visible dans le catalogue et contactable via une
              messagerie interne.
            </p>
          </div>

          <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
            Titre
            <input
              value={formState.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Besoin d&apos;aide pour porter un meuble"
              className="rounded-[1.2rem] border border-line bg-surface px-4 py-3 font-normal outline-none focus:border-brand/40 focus:bg-white"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
            Description
            <textarea
              rows={6}
              value={formState.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Explique clairement le besoin, le contexte et le temps necessaire."
              className="rounded-[1.2rem] border border-line bg-surface px-4 py-3 font-normal outline-none focus:border-brand/40 focus:bg-white"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
              Type
              <select
                value={formState.type}
                onChange={(event) => updateField("type", event.target.value)}
                className="rounded-[1.2rem] border border-line bg-surface px-4 py-3 font-normal outline-none focus:border-brand/40 focus:bg-white"
              >
                <option value="request">Je demande de l&apos;aide</option>
                <option value="offer">Je propose de l&apos;aide</option>
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
              Categorie
              <select
                value={formState.category}
                onChange={(event) => updateField("category", event.target.value)}
                className="rounded-[1.2rem] border border-line bg-surface px-4 py-3 font-normal outline-none focus:border-brand/40 focus:bg-white"
              >
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
              Ville
              <input
                value={formState.city}
                onChange={(event) => updateField("city", event.target.value)}
                className="rounded-[1.2rem] border border-line bg-surface px-4 py-3 font-normal outline-none focus:border-brand/40 focus:bg-white"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
              Disponibilite
              <input
                value={formState.availability}
                onChange={(event) =>
                  updateField("availability", event.target.value)
                }
                placeholder="Ex: samedi 14h - 16h"
                className="rounded-[1.2rem] border border-line bg-surface px-4 py-3 font-normal outline-none focus:border-brand/40 focus:bg-white"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
              Email prive de contact
              <input
                value={formState.contact}
                onChange={(event) => updateField("contact", event.target.value)}
                type="email"
                className="rounded-[1.2rem] border border-line bg-surface px-4 py-3 font-normal outline-none focus:border-brand/40 focus:bg-white"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
              Telephone prive
              <input
                value={formState.phoneNumber}
                onChange={(event) => updateField("phoneNumber", event.target.value)}
                placeholder="Optionnel, ex: 06 12 34 56 78"
                className="rounded-[1.2rem] border border-line bg-surface px-4 py-3 font-normal outline-none focus:border-brand/40 focus:bg-white"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
              Tags
              <input
                value={formState.tags}
                onChange={(event) => updateField("tags", event.target.value)}
                placeholder="meuble, quartier, rapide"
                className="rounded-[1.2rem] border border-line bg-surface px-4 py-3 font-normal outline-none focus:border-brand/40 focus:bg-white"
              />
            </label>
            <div className="rounded-[1.2rem] border border-dashed border-line bg-surface px-4 py-4 text-sm leading-6 text-muted">
              L&apos;email et le telephone restent masques pour les autres
              visiteurs. Les premiers echanges passent par la messagerie
              interne.
            </div>
          </div>

          <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
            Image de l&apos;annonce
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                handleImageChange(event.target.files?.[0] ?? null)
              }
              className="rounded-[1.2rem] border border-dashed border-line bg-surface px-4 py-3 font-normal text-muted outline-none file:mr-4 file:rounded-full file:border-0 file:bg-brand-soft file:px-4 file:py-2 file:font-semibold file:text-brand-strong"
            />
          </label>

          <label className="flex items-center gap-3 rounded-[1.2rem] border border-line bg-surface px-4 py-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={formState.urgent}
              onChange={(event) => updateField("urgent", event.target.checked)}
              className="h-4 w-4 accent-[var(--brand)]"
            />
            Marquer l&apos;annonce comme urgente
          </label>

          {error ? (
            <div className="rounded-[1.2rem] border border-accent/20 bg-accent-soft p-4 text-sm text-accent">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex w-full items-center justify-center rounded-full bg-brand px-5 py-4 text-sm font-semibold text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "Publication..." : "Publier l&apos;annonce"}
          </button>
        </form>

        <div className="rounded-[1.75rem] border border-line bg-surface-strong p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
            Apercu en direct
          </p>
          <div className="mt-5 overflow-hidden rounded-[1.75rem] bg-white card-shadow">
            <div className="relative h-56 bg-surface">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Apercu de l&apos;image selectionnee"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,rgba(255,111,20,0.14),rgba(37,99,235,0.14))] p-6 text-center text-sm text-muted">
                  Ajoute une photo pour donner plus de contexte a ton annonce.
                </div>
              )}
            </div>

            <div className="space-y-4 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    formState.type === "request"
                      ? "bg-accent-soft text-accent"
                      : "bg-brand-soft text-brand-strong"
                  }`}
                >
                  {formState.type === "request" ? "Demande" : "Offre"}
                </span>
                <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-muted">
                  {categories.find((item) => item.slug === formState.category)?.name ??
                    "Categorie"}
                </span>
                {formState.urgent ? (
                  <span className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-white">
                    Urgent
                  </span>
                ) : null}
              </div>

              <div>
                <p className="text-sm text-muted">
                  {formState.city || currentUser.city} - {currentUser.displayName}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-foreground">
                  {formState.title || "Titre de l&apos;annonce"}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted">
                  {formState.description ||
                    "La description apparaitra ici au fur et a mesure de ta saisie."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-surface-strong p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                    Contact protege
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {formState.contact || currentUser.email}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Masque cote public, visible seulement dans ton espace.
                  </p>
                </div>
                <div className="rounded-2xl bg-surface-strong p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                    Disponibilite
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {formState.availability || "A preciser"}
                  </p>
                </div>
              </div>

              {formState.phoneNumber ? (
                <div className="rounded-2xl bg-surface-strong p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                    Telephone prive
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {formState.phoneNumber}
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {formState.tags
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean)
                  .slice(0, 5)
                  .map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-surface px-3 py-1 text-xs text-muted"
                    >
                      #{tag}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
