"use client";

import { useSyncExternalStore } from "react";

type AccentTheme = "orange" | "teal" | "blue" | "berry";

type AccentThemeToggleProps = {
  showLabel?: boolean;
  dark?: boolean;
};

const storageKey = "coupdemain-accent";

const themes: Array<{
  id: AccentTheme;
  label: string;
  swatch: string;
}> = [
  { id: "orange", label: "Orange", swatch: "#ff6f14" },
  { id: "teal", label: "Ocean", swatch: "#0f766e" },
  { id: "blue", label: "Azur", swatch: "#2563eb" },
  { id: "berry", label: "Berry", swatch: "#7c3aed" },
];

const listeners = new Set<() => void>();

function readTheme(): AccentTheme {
  if (typeof document === "undefined") {
    return "orange";
  }

  const theme = document.documentElement.dataset.accent;

  return themes.some((entry) => entry.id === theme)
    ? (theme as AccentTheme)
    : "orange";
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function applyTheme(theme: AccentTheme) {
  document.documentElement.dataset.accent = theme;
  window.localStorage.setItem(storageKey, theme);
  listeners.forEach((listener) => listener());
}

export function AccentThemeToggle({
  showLabel = false,
  dark = false,
}: AccentThemeToggleProps) {
  const currentTheme = useSyncExternalStore(subscribe, readTheme, () => "orange");

  const panelClass = dark
    ? "border-white/10 bg-white/5 text-white"
    : "border-line bg-white/85 text-foreground";
  const helperClass = dark ? "text-white/70" : "text-muted";
  const buttonBaseClass = dark
    ? "border-white/10 bg-white/10 hover:bg-white/15"
    : "border-line bg-surface hover:bg-white";

  return (
    <div
      className={`flex flex-col gap-3 rounded-[1.4rem] border p-3 ${panelClass}`}
    >
      {showLabel ? (
        <div className="space-y-1">
          <p className="text-sm font-semibold">Couleur interactive</p>
          <p className={`text-sm leading-6 ${helperClass}`}>
            Change l&apos;accent du site en direct pour trouver l&apos;ambiance la
            plus juste.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {themes.map((theme) => {
          const isActive = currentTheme === theme.id;

          return (
            <button
              key={theme.id}
              type="button"
              aria-label={`Choisir le theme ${theme.label}`}
              aria-pressed={isActive}
              onClick={() => {
                applyTheme(theme.id);
              }}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold ${
                isActive ? "ring-2 ring-brand/20" : ""
              } ${buttonBaseClass}`}
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: theme.swatch }}
              />
              {showLabel ? theme.label : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
