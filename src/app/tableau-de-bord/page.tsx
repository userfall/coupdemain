import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { SectionHeading } from "@/components/section-heading";
import { dashboardTasks } from "@/lib/demo-data";
import { getMarketplaceStats, listPosts } from "@/lib/server/marketplace";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, posts] = await Promise.all([
    getMarketplaceStats(),
    listPosts(4),
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-line bg-white/90 p-6 sm:p-8">
        <SectionHeading
          eyebrow="Vue plateforme"
          title="Le projet tourne maintenant sur une vraie base locale."
          description="Comptes, sessions, annonces, messagerie et notifications sont relies entre eux. Cette page sert a presenter l'etat general du produit."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[1.5rem] border border-line bg-surface p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
            Annonces actives
          </p>
          <p className="mt-3 font-serif text-4xl text-foreground">
            {stats.activePosts}
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-line bg-surface p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
            Membres
          </p>
          <p className="mt-3 font-serif text-4xl text-foreground">{stats.users}</p>
        </div>
        <div className="rounded-[1.5rem] border border-line bg-surface p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
            Villes
          </p>
          <p className="mt-3 font-serif text-4xl text-foreground">{stats.cities}</p>
        </div>
        <div className="rounded-[1.5rem] border border-line bg-surface p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
            Resolutions
          </p>
          <p className="mt-3 font-serif text-4xl text-foreground">
            {stats.resolvedPosts}
          </p>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="space-y-4 rounded-[2rem] border border-line bg-white/85 p-6">
          <h2 className="font-serif text-3xl text-foreground">
            Prochaines etapes utiles
          </h2>
          <div className="space-y-3">
            {dashboardTasks.map((task) => (
              <article
                key={task.title}
                className="rounded-[1.35rem] border border-line bg-surface p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-foreground">{task.title}</h3>
                  <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-strong">
                    {task.priority}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {task.description}
                </p>
              </article>
            ))}
          </div>
          <Link
            href="/deposer"
            className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-strong"
          >
            Publier une annonce
          </Link>
        </div>

        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-3xl text-foreground">
              Dernieres publications
            </h2>
            <Link
              href="/annonces"
              className="text-sm font-semibold text-brand hover:text-brand-strong"
            >
              Voir tout
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
