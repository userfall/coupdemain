"use client";

import { useMemo, useState } from "react";
import { PostCard } from "@/components/post-card";
import type { Category, CommunityPost } from "@/lib/types";

type PostDirectoryProps = {
  posts: CommunityPost[];
  categories: Category[];
};

export function PostDirectory({ posts, categories }: PostDirectoryProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [urgentOnly, setUrgentOnly] = useState(false);

  const cities = useMemo(
    () => Array.from(new Set(posts.map((post) => post.city))).sort(),
    [posts],
  );

  const filteredPosts = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    return posts.filter((post) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [post.title, post.description, post.author, post.categoryLabel, post.city]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesCategory =
        selectedCategory === "all" || post.category === selectedCategory;
      const matchesType = selectedType === "all" || post.type === selectedType;
      const matchesCity = selectedCity === "all" || post.city === selectedCity;
      const matchesUrgency = !urgentOnly || post.urgent;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesType &&
        matchesCity &&
        matchesUrgency
      );
    });
  }, [posts, search, selectedCategory, selectedType, selectedCity, urgentOnly]);

  return (
    <section className="space-y-6">
      <div className="grid gap-4 rounded-[2rem] border border-line bg-white/90 p-5 xl:grid-cols-[1.4fr_repeat(4,_0.7fr)]">
        <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
          Recherche
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ex: courses, meuble, administratif..."
            className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-normal outline-none placeholder:text-muted/70 focus:border-brand/40 focus:bg-white"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
          Categorie
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-normal outline-none focus:border-brand/40 focus:bg-white"
          >
            <option value="all">Toutes</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
          Type
          <select
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
            className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-normal outline-none focus:border-brand/40 focus:bg-white"
          >
            <option value="all">Tout</option>
            <option value="request">Demandes</option>
            <option value="offer">Offres</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
          Ville
          <select
            value={selectedCity}
            onChange={(event) => setSelectedCity(event.target.value)}
            className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-normal outline-none focus:border-brand/40 focus:bg-white"
          >
            <option value="all">Partout</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-end">
          <span className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-semibold text-foreground">
            <span>Urgent seulement</span>
            <input
              type="checkbox"
              checked={urgentOnly}
              onChange={(event) => setUrgentOnly(event.target.checked)}
              className="h-4 w-4 accent-[var(--brand)]"
            />
          </span>
        </label>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          {filteredPosts.length} annonce{filteredPosts.length > 1 ? "s" : ""}{" "}
          affichee{filteredPosts.length > 1 ? "s" : ""}
        </p>
        <button
          type="button"
          onClick={() => {
            setSearch("");
            setSelectedCategory("all");
            setSelectedType("all");
            setSelectedCity("all");
            setUrgentOnly(false);
          }}
          className="w-fit rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-foreground hover:border-brand/35 hover:text-brand-strong"
        >
          Reinitialiser les filtres
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {filteredPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {filteredPosts.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-line bg-white/70 px-6 py-10 text-center">
          <p className="text-lg font-semibold text-foreground">
            Aucune annonce ne correspond a ces filtres.
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Essaie d&apos;elargir la ville, la categorie ou le niveau d&apos;urgence.
          </p>
        </div>
      ) : null}
    </section>
  );
}
