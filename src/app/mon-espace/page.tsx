import Link from "next/link";
import { ConversationList } from "@/components/conversation-list";
import { ProfileAvatarForm } from "@/components/forms/profile-avatar-form";
import { PostCard } from "@/components/post-card";
import { SectionHeading } from "@/components/section-heading";
import { UserAvatar } from "@/components/user-avatar";
import { requireUser } from "@/lib/server/auth";
import { listConversationsForUser } from "@/lib/server/messaging";
import {
  getMarketplaceStats,
  listPostsByUser,
  listSavedPosts,
} from "@/lib/server/marketplace";

export const dynamic = "force-dynamic";

export default async function MonEspacePage() {
  const currentUser = await requireUser("/connexion?next=/mon-espace");
  const [userPosts, savedPosts, conversations, stats] = await Promise.all([
    listPostsByUser(currentUser.id),
    listSavedPosts(currentUser.id),
    listConversationsForUser(currentUser.id),
    getMarketplaceStats(),
  ]);
  const openPosts = userPosts.filter((post) => post.status === "open").length;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 rounded-[2rem] border border-line bg-white/90 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
        <div className="space-y-4">
          <SectionHeading
            eyebrow="Mon espace"
            title={`Bonjour ${currentUser.displayName}, tout ton suivi commence ici.`}
            description="Tu peux publier, surveiller tes annonces, retrouver tes favoris et discuter avec d'autres membres sans exposer tes coordonnees publiquement."
          />
          <div className="flex flex-wrap gap-3">
            <Link
              href="/deposer"
              className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-strong"
            >
              Publier une annonce
            </Link>
            <Link
              href="/messages"
              className="inline-flex items-center justify-center rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold text-foreground hover:border-brand/30 hover:text-brand-strong"
            >
              Ouvrir la messagerie
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.5rem] border border-line bg-surface p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
              Ton profil
            </p>
            <div className="mt-3 flex items-center gap-4">
              <UserAvatar
                name={currentUser.displayName}
                avatarPath={currentUser.avatarPath}
                size="lg"
              />
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {currentUser.displayName}
                </p>
                <p className="text-sm text-muted">{currentUser.email}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{currentUser.city}</p>
              </div>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-line bg-surface p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
              Tes annonces ouvertes
            </p>
            <p className="mt-3 font-serif text-4xl text-foreground">{openPosts}</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              {userPosts.length} annonce{userPosts.length > 1 ? "s" : ""} au total
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
            Annonces actives
          </p>
          <p className="mt-3 font-serif text-4xl text-foreground">
            {stats.activePosts}
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
            Conversations
          </p>
          <p className="mt-3 font-serif text-4xl text-foreground">
            {conversations.length}
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
            Favoris
          </p>
          <p className="mt-3 font-serif text-4xl text-foreground">
            {savedPosts.length}
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
            Resolutions
          </p>
          <p className="mt-3 font-serif text-4xl text-foreground">
            {stats.resolvedPosts}
          </p>
        </div>
      </section>

      <ProfileAvatarForm currentUser={currentUser} />

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
                Tes publications
              </p>
              <h2 className="mt-2 font-serif text-3xl text-foreground">
                Suivre ce que tu as deja publie
              </h2>
            </div>
            <Link
              href="/deposer"
              className="text-sm font-semibold text-brand hover:text-brand-strong"
            >
              Ajouter une annonce
            </Link>
          </div>

          {userPosts.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-line bg-white/70 px-6 py-10 text-center">
              <p className="text-lg font-semibold text-foreground">
                Tu n&apos;as pas encore publie d&apos;annonce.
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Cree la premiere pour verifier le vrai parcours de bout en bout.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
                Conversations recentes
              </p>
              <h2 className="mt-2 font-serif text-3xl text-foreground">
                Repondre rapidement
              </h2>
            </div>
            <Link
              href="/messages"
              className="text-sm font-semibold text-brand hover:text-brand-strong"
            >
              Tout voir
            </Link>
          </div>

          {conversations.length > 0 ? (
            <ConversationList conversations={conversations.slice(0, 3)} />
          ) : (
            <div className="rounded-[2rem] border border-dashed border-line bg-white/70 px-6 py-8 text-center">
              <p className="text-lg font-semibold text-foreground">
                Aucune conversation active.
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Les prises de contact se retrouveront ici des qu&apos;un membre
                t&apos;ecrit ou que tu lances un echange.
              </p>
            </div>
          )}

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              Favoris
            </p>
            <h2 className="mt-2 font-serif text-3xl text-foreground">
              Garder des annonces de cote
            </h2>
          </div>

          {savedPosts.length > 0 ? (
            <div className="grid gap-4">
              {savedPosts.slice(0, 2).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-line bg-white/70 px-6 py-8 text-center">
              <p className="text-lg font-semibold text-foreground">
                Aucun favori enregistre.
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Depuis une annonce, tu peux la sauvegarder pour la retrouver ici.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
