"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { AccentThemeToggle } from "@/components/accent-theme-toggle";
import { UserAvatar } from "@/components/user-avatar";

type AuthExperienceProps = {
  mode: "signin" | "signup";
  nextPath: string;
  demoEmail: string;
  demoPassword: string;
};

const valueCards = [
  {
    title: "Publier avec image",
    description: "Une annonce plus claire, plus rassurante, plus proche d'un vrai site de petites annonces.",
  },
  {
    title: "Revenir facilement",
    description: "Ton espace membre garde tes publications et tes coordonnees au meme endroit.",
  },
  {
    title: "Passer a l'action vite",
    description: "Connexion simple, publication directe, interface propre et lisible sur mobile aussi.",
  },
];

export function AuthExperience({
  mode,
  nextPath,
  demoEmail,
  demoPassword,
}: AuthExperienceProps) {
  const router = useRouter();
  const isSignin = mode === "signin";
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    displayName: "",
    city: "",
    email: isSignin ? demoEmail : "",
    password: isSignin ? demoPassword : "",
    confirmPassword: "",
    acceptTerms: true,
    rememberMe: true,
  });

  const switchHref = isSignin
    ? `/inscription?next=${encodeURIComponent(nextPath)}`
    : `/connexion?next=${encodeURIComponent(nextPath)}`;

  const title = isSignin
    ? "Retrouve ton espace membre et publie plus vite."
    : "Cree un vrai compte pour commencer a publier des annonces.";
  const intro = isSignin
    ? "Connexion reelle avec session locale, publications conservees et acces direct a ton espace."
    : "Inscription reelle, base locale active et experience prete pour publier une annonce avec image.";
  const submitLabel = isSignin ? "Me connecter" : "Creer mon compte";

  function updateField(name: keyof typeof formState, value: string | boolean) {
    setFormState((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!isSignin && formState.password !== formState.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    startTransition(async () => {
      const endpoint = isSignin ? "/api/auth/login" : "/api/auth/register";
      const response = await fetch(
        endpoint,
        isSignin
          ? {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: formState.email,
                password: formState.password,
                rememberMe: formState.rememberMe,
              }),
            }
          : (() => {
              const payload = new FormData();
              payload.set("displayName", formState.displayName);
              payload.set("city", formState.city);
              payload.set("email", formState.email);
              payload.set("password", formState.password);
              payload.set("acceptTerms", String(formState.acceptTerms));
              payload.set("rememberMe", String(formState.rememberMe));

              if (avatarFile) {
                payload.set("avatar", avatarFile);
              }

              return {
                method: "POST",
                body: payload,
              };
            })(),
      );

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setError(payload?.error ?? "Une erreur est survenue.");
        return;
      }

      router.replace(nextPath);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr]">
      <section className="auth-stage relative overflow-hidden rounded-[2.4rem] p-6 text-white sm:p-8">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.04))]" />
        <div className="relative flex h-full flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white">
              Authentification reelle
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
              Base locale + sessions + publications
            </span>
          </div>

          <div className="max-w-2xl space-y-4">
            <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
              {title}
            </h1>
            <p className="max-w-xl text-base leading-8 text-white/70">
              {intro}
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {valueCards.map((card) => (
              <article
                key={card.title}
                className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5"
              >
                <h2 className="text-lg font-semibold text-white">{card.title}</h2>
                <p className="mt-3 text-sm leading-6 text-white/75">
                  {card.description}
                </p>
              </article>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.65rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">
                Publication moderne
              </p>
              <p className="mt-3 text-sm leading-7 text-white/70">
                Ajoute une image, une description claire et un contact. L&apos;annonce
                apparait ensuite dans le catalogue public.
              </p>
            </div>
            <div className="rounded-[1.65rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">
                Compte de test
              </p>
              <p className="mt-3 text-sm leading-7 text-white/70">
                Email : {demoEmail}
                <br />
                Mot de passe : {demoPassword}
              </p>
            </div>
          </div>

          <AccentThemeToggle showLabel dark />
        </div>
      </section>

      <section className="rounded-[2.4rem] border border-line bg-white/90 p-6 soft-ring sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full bg-brand-soft px-4 py-2 text-sm font-semibold text-brand-strong">
            {isSignin ? "Connexion active" : "Inscription active"}
          </span>
          <span className="text-sm text-muted">
            {isSignin ? "Accede a ton espace." : "Publie ta premiere annonce rapidement."}
          </span>
        </div>

        <div className="mt-6 flex rounded-full border border-line bg-surface p-1">
          <Link
            href={`/connexion?next=${encodeURIComponent(nextPath)}`}
            className={`flex-1 rounded-full px-4 py-3 text-center text-sm font-semibold ${
              isSignin
                ? "bg-brand text-white shadow-lg shadow-brand/20"
                : "text-muted hover:text-brand-strong"
            }`}
          >
            Connexion
          </Link>
          <Link
            href={`/inscription?next=${encodeURIComponent(nextPath)}`}
            className={`flex-1 rounded-full px-4 py-3 text-center text-sm font-semibold ${
              !isSignin
                ? "bg-brand text-white shadow-lg shadow-brand/20"
                : "text-muted hover:text-brand-strong"
            }`}
          >
            Inscription
          </Link>
        </div>

        <div className="mt-8">
          <h2 className="font-serif text-4xl text-foreground">
            {isSignin ? "Connecte-toi" : "Ouvre ton espace"}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
            {isSignin
              ? "Entre ton email et ton mot de passe pour retrouver tes annonces et publier avec image."
              : "Renseigne quelques infos utiles. Le compte sera cree tout de suite dans la base locale du projet."}
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {!isSignin ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
                Nom affiche
                <input
                  value={formState.displayName}
                  onChange={(event) => updateField("displayName", event.target.value)}
                  placeholder="Lea Martin"
                  className="rounded-[1.2rem] border border-line bg-surface px-4 py-3 font-normal outline-none focus:border-brand/40 focus:bg-white"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
                Ville
                <input
                  value={formState.city}
                  onChange={(event) => updateField("city", event.target.value)}
                  placeholder="Lille"
                  className="rounded-[1.2rem] border border-line bg-surface px-4 py-3 font-normal outline-none focus:border-brand/40 focus:bg-white"
                />
              </label>
            </div>
          ) : null}

          {!isSignin ? (
            <div className="rounded-[1.4rem] border border-line bg-surface p-4">
              <div className="flex items-center gap-4">
                {avatarPreviewUrl ? (
                  <div className="relative h-20 w-20 overflow-hidden rounded-full border border-line">
                    <Image
                      src={avatarPreviewUrl}
                      alt="Apercu de la photo de profil"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <UserAvatar
                    name={formState.displayName || "Nouveau membre"}
                    size="xl"
                  />
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Photo de profil
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Optionnel, mais tres utile pour donner confiance dans les annonces et les messages.
                  </p>
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null;
                  setAvatarFile(nextFile);
                  setAvatarPreviewUrl(
                    nextFile ? URL.createObjectURL(nextFile) : null,
                  );
                }}
                className="mt-4 rounded-[1.2rem] border border-dashed border-line bg-white px-4 py-3 font-normal text-sm text-muted outline-none file:mr-4 file:rounded-full file:border-0 file:bg-brand-soft file:px-4 file:py-2 file:font-semibold file:text-brand-strong"
              />
            </div>
          ) : null}

          <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
            Email
            <input
              type="email"
              value={formState.email}
              onChange={(event) => updateField("email", event.target.value)}
              className="rounded-[1.2rem] border border-line bg-surface px-4 py-3 font-normal outline-none focus:border-brand/40 focus:bg-white"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
              Mot de passe
              <input
                type="password"
                value={formState.password}
                onChange={(event) => updateField("password", event.target.value)}
                className="rounded-[1.2rem] border border-line bg-surface px-4 py-3 font-normal outline-none focus:border-brand/40 focus:bg-white"
              />
            </label>

            {!isSignin ? (
              <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
                Confirmation
                <input
                  type="password"
                  value={formState.confirmPassword}
                  onChange={(event) =>
                    updateField("confirmPassword", event.target.value)
                  }
                  className="rounded-[1.2rem] border border-line bg-surface px-4 py-3 font-normal outline-none focus:border-brand/40 focus:bg-white"
                />
              </label>
            ) : (
              <div className="flex items-end rounded-[1.2rem] border border-line bg-surface px-4 py-3">
                <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={formState.rememberMe}
                    onChange={(event) =>
                      updateField("rememberMe", event.target.checked)
                    }
                    className="h-4 w-4 accent-[var(--brand)]"
                  />
                  Garder ma session
                </label>
              </div>
            )}
          </div>

          {!isSignin ? (
            <label className="flex items-center gap-3 rounded-[1.2rem] border border-line bg-surface px-4 py-3 text-sm text-muted">
              <input
                type="checkbox"
                checked={formState.acceptTerms}
                onChange={(event) => updateField("acceptTerms", event.target.checked)}
                className="h-4 w-4 accent-[var(--brand)]"
              />
              J&apos;accepte les regles de confiance et je publie des annonces claires.
            </label>
          ) : null}

          {error ? (
            <div className="rounded-[1.25rem] border border-accent/20 bg-accent-soft p-4 text-sm text-accent">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-brand/20 hover:-translate-y-0.5 hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "Chargement..." : submitLabel}
          </button>

          {isSignin ? (
            <button
              type="button"
              onClick={() =>
                setFormState((current) => ({
                  ...current,
                  email: demoEmail,
                  password: demoPassword,
                }))
              }
              className="inline-flex w-full items-center justify-center rounded-full border border-line bg-white px-6 py-4 text-sm font-semibold text-foreground hover:border-brand/30 hover:text-brand-strong"
            >
              Utiliser le compte de demo
            </button>
          ) : null}
        </form>

        <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>{isSignin ? "Pas encore inscrit ?" : "Tu as deja un compte ?"}</span>
          <Link href={switchHref} className="font-semibold text-brand hover:text-brand-strong">
            {isSignin ? "Creer un compte" : "Me connecter"}
          </Link>
        </div>
      </section>
    </div>
  );
}
