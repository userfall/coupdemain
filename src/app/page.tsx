import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { SectionHeading } from "@/components/section-heading";
import { faqItems, journeySteps, trustSignals } from "@/lib/demo-data";
import { getCategories, getFeaturedPosts, getMarketplaceStats } from "@/lib/server/marketplace";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [stats, categories, featuredPosts] = await Promise.all([
    getMarketplaceStats(),
    getCategories(),
    getFeaturedPosts(),
  ]);
  const highlightedCategories = categories.slice(0, 4);

  return (
    <div className="flex flex-col gap-12 md:gap-16">
      <section className="overflow-hidden rounded-[2.2rem] border border-white/70 bg-white/92 soft-ring">
        <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:px-10 lg:py-10">
          <div className="flex flex-col gap-6">
            <span className="w-fit rounded-full border border-brand/20 bg-brand-soft px-4 py-2 text-sm font-semibold text-brand-strong">
              Marketplace locale, inspiree des meilleurs parcours de petites annonces
            </span>
            <div className="space-y-4">
              <h1 className="max-w-3xl font-serif text-4xl leading-tight text-foreground sm:text-5xl lg:text-[3.6rem]">
                Demander de l&apos;aide, publier une annonce, discuter en prive et suivre tout au meme endroit.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted">
                CoupDeMain assemble catalogue, messagerie, notifications et espace
                membre dans une interface claire, rapide et plus proche d&apos;une
                vraie place de marche.
              </p>
            </div>

            <div className="market-search-panel rounded-[1.8rem] border border-line p-4">
              <div className="grid gap-3 lg:grid-cols-[1.4fr_0.9fr_0.8fr]">
                <div className="rounded-[1.2rem] border border-line bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    Que cherches-tu ?
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    Aide pour meuble, transport, administratif, soutien...
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-line bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    Zone
                  </p>
                  <p className="mt-2 text-sm text-foreground">Lille et alentours</p>
                </div>
                <Link
                  href="/annonces"
                  className="inline-flex items-center justify-center rounded-[1.2rem] bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 hover:bg-brand-strong"
                >
                  Rechercher
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {highlightedCategories.map((category) => (
                  <Link
                    key={category.slug}
                    href="/annonces"
                    className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:border-brand/25 hover:text-brand-strong"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/annonces"
                className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand/20 hover:-translate-y-0.5 hover:bg-brand-strong"
              >
                Explorer les annonces
              </Link>
              <Link
                href="/deposer"
                className="inline-flex items-center justify-center rounded-full border border-line bg-white/80 px-6 py-3 text-base font-semibold text-foreground hover:-translate-y-0.5 hover:border-brand/35 hover:text-brand-strong"
              >
                Publier une annonce
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-line bg-white/90 px-4 py-4">
                <p className="text-3xl font-bold text-foreground">{stats.activePosts}</p>
                <p className="mt-1 text-sm text-muted">annonces actives</p>
              </div>
              <div className="rounded-3xl border border-line bg-white/90 px-4 py-4">
                <p className="text-3xl font-bold text-foreground">{stats.users}</p>
                <p className="mt-1 text-sm text-muted">membres inscrits</p>
              </div>
              <div className="rounded-3xl border border-line bg-white/90 px-4 py-4">
                <p className="text-3xl font-bold text-foreground">{stats.cities}</p>
                <p className="mt-1 text-sm text-muted">villes actives</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="market-highlight-panel rounded-[1.85rem] border border-line p-6 card-shadow">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                  Parcours complet
                </span>
                <span className="text-sm text-muted">Version locale</span>
              </div>
              <div className="mt-5 space-y-4">
                <p className="font-serif text-3xl leading-tight">
                  Une annonce peut maintenant recevoir des messages prives, des vues et des favoris.
                </p>
                <div className="grid gap-3">
                  <div className="rounded-3xl border border-white/70 bg-white/78 p-4">
                    <p className="text-sm font-semibold text-foreground">
                      Messagerie active
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Rafraichissement automatique des conversations et lecture plus confortable des echanges.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/70 bg-white/78 p-4">
                    <p className="text-sm font-semibold text-foreground">
                      Notifications visibles
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Badge de messages non lus et centre d&apos;activite dedie pour suivre ce qui change.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-4 rounded-[1.75rem] border border-line bg-white/88 p-6 md:grid-cols-2">
              {trustSignals.map((signal) => (
                <div key={signal.title} className="rounded-3xl bg-surface-strong p-4">
                  <p className="text-sm font-semibold text-foreground">
                    {signal.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {signal.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Categories"
          title="Des besoins simples, classes proprement, avec de vraies annonces visibles tout de suite."
          description="Le catalogue s&apos;appuie maintenant sur les categories de la base locale et affiche de vrais compteurs d&apos;annonces ouvertes."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <article
              key={category.slug}
              className="rounded-[1.75rem] border border-line bg-white/80 p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-foreground">
                  {category.name}
                </h3>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: category.tint,
                    color: category.textColor,
                  }}
                >
                  {category.count} actives
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">
                {category.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Apercu"
            title="Dernieres annonces publiees sur la plateforme"
            description="Ces cartes viennent directement de la base locale. Toute nouvelle publication apparait ici et dans le catalogue."
          />
          <Link
            href="/annonces"
            className="text-sm font-semibold text-brand hover:text-brand-strong"
          >
            Voir toutes les annonces
          </Link>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {featuredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>

      <section className="grid gap-8 rounded-[2rem] border border-line bg-white/85 p-6 lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
        <SectionHeading
          eyebrow="Parcours"
          title="Le projet a maintenant un vrai fil rouge utilisateur."
          description="Compte, session, publication, messagerie et notifications sont relies. Le prochain grand palier sera le temps reel complet et la moderation fine."
        />
        <div className="grid gap-4">
          {journeySteps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-[1.5rem] border border-line bg-surface p-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-sm font-bold text-white">
                  0{index + 1}
                </span>
                <h3 className="text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Questions frequentes"
          title="Les points utiles pour tester rapidement le projet"
          description="Le site reste local, mais le parcours principal fonctionne deja comme une vraie application."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {faqItems.map((item) => (
            <article
              key={item.question}
              className="rounded-[1.5rem] border border-line bg-white/80 p-5"
            >
              <h3 className="text-lg font-semibold text-foreground">
                {item.question}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted">
                {item.answer}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] bg-foreground px-6 py-8 text-white sm:px-8 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent-soft">
              Et maintenant
            </p>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl">
              Tu peux deja creer un compte, publier une annonce avec image, discuter en prive et suivre tes activites.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/72">
              La base locale facilite le dev et les tests. Plus tard, on pourra
              basculer vers un backend distant avec websocket, moderation et mise
              en ligne publique.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/mon-espace"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-foreground hover:-translate-y-0.5"
            >
              Ouvrir mon espace
            </Link>
            <Link
              href="/deposer"
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-white/10"
            >
              Publier maintenant
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
