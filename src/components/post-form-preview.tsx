"use client";

import { FormEvent, useMemo, useState } from "react";

const defaultValues = {
  title: "Besoin d'aide pour monter un meuble samedi",
  description:
    "Je cherche une personne disponible une heure samedi après-midi pour m'aider à porter et monter une petite armoire au 3e étage.",
  type: "request",
  category: "entraide-pratique",
  city: "Roubaix",
  contact: "sarah@example.com",
  availability: "Samedi 15h - 17h",
};

const categoryLabels: Record<string, string> = {
  "entraide-pratique": "Entraide pratique",
  "courses-transport": "Courses et transport",
  "numerique-administratif": "Numérique et administratif",
  "education-soutien": "Éducation et soutien scolaire",
  "bien-etre-presence": "Bien-être et présence",
  "objets-solidaires": "Dons et objets solidaires",
};

export function PostFormPreview() {
  const [values, setValues] = useState(defaultValues);
  const [submitted, setSubmitted] = useState(false);

  const previewTypeLabel =
    values.type === "request" ? "Demande d'aide" : "Offre d'aide";

  const previewCategory = useMemo(
    () => categoryLabels[values.category] ?? values.category,
    [values.category],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className="rounded-[2rem] border border-line bg-white/90 p-6">
      <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <h2 className="font-serif text-3xl text-foreground">
              Déposer une annonce
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Cette version simule l&apos;envoi. Une fois Supabase branché, ce
              formulaire deviendra directement persistant.
            </p>
          </div>

          <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
            Titre
            <input
              value={values.title}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              className="rounded-2xl border border-line bg-surface px-4 py-3 font-normal outline-none focus:border-brand/40 focus:bg-white"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
            Description
            <textarea
              rows={5}
              value={values.description}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className="rounded-2xl border border-line bg-surface px-4 py-3 font-normal outline-none focus:border-brand/40 focus:bg-white"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
              Type
              <select
                value={values.type}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    type: event.target.value,
                  }))
                }
                className="rounded-2xl border border-line bg-surface px-4 py-3 font-normal outline-none focus:border-brand/40 focus:bg-white"
              >
                <option value="request">Je demande de l&apos;aide</option>
                <option value="offer">Je propose de l&apos;aide</option>
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
              Catégorie
              <select
                value={values.category}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
                className="rounded-2xl border border-line bg-surface px-4 py-3 font-normal outline-none focus:border-brand/40 focus:bg-white"
              >
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
              Ville
              <input
                value={values.city}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    city: event.target.value,
                  }))
                }
                className="rounded-2xl border border-line bg-surface px-4 py-3 font-normal outline-none focus:border-brand/40 focus:bg-white"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
              Créneau disponible
              <input
                value={values.availability}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    availability: event.target.value,
                  }))
                }
                className="rounded-2xl border border-line bg-surface px-4 py-3 font-normal outline-none focus:border-brand/40 focus:bg-white"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
            Contact
            <input
              value={values.contact}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  contact: event.target.value,
                }))
              }
              className="rounded-2xl border border-line bg-surface px-4 py-3 font-normal outline-none focus:border-brand/40 focus:bg-white"
            />
          </label>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-strong"
          >
            Simuler la publication
          </button>

          {submitted ? (
            <div className="rounded-[1.5rem] border border-brand/15 bg-brand-soft p-4 text-sm leading-6 text-brand-strong">
              Annonce prête. La prochaine étape consiste à enregistrer ces
              données dans Supabase via une server action ou une route API.
            </div>
          ) : null}
        </form>

        <div className="rounded-[1.75rem] border border-line bg-surface-strong p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
            Aperçu instantané
          </p>
          <div className="mt-5 rounded-[1.75rem] bg-white p-5 card-shadow">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  values.type === "request"
                    ? "bg-accent-soft text-accent"
                    : "bg-brand-soft text-brand-strong"
                }`}
              >
                {previewTypeLabel}
              </span>
              <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-muted">
                {previewCategory}
              </span>
            </div>

            <h3 className="mt-4 text-2xl font-semibold text-foreground">
              {values.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              {values.description}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-surface-strong p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                  Ville
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {values.city}
                </p>
              </div>
              <div className="rounded-2xl bg-surface-strong p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                  Créneau
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {values.availability}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-line bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                Contact affiché
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {values.contact}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
