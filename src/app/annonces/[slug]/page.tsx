import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostStatusControl } from "@/components/post-status-control";
import { PostCard } from "@/components/post-card";
import { SavePostButton } from "@/components/save-post-button";
import { StartConversationPanel } from "@/components/start-conversation-panel";
import { UserAvatar } from "@/components/user-avatar";
import { getCurrentUser } from "@/lib/server/auth";
import {
  findConversationForUserAndPost,
} from "@/lib/server/messaging";
import {
  getPostDetailBySlug,
  incrementPostViews,
  listSimilarPosts,
} from "@/lib/server/marketplace";

type PostDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { slug } = await params;
  const currentUser = await getCurrentUser();
  const detail = getPostDetailBySlug(slug, currentUser?.id);

  if (!detail) {
    notFound();
  }

  let post = detail;

  if (!detail.isOwner) {
    incrementPostViews(detail.id);
    post = {
      ...detail,
      views: detail.views + 1,
    };
  }

  const similarPosts = listSimilarPosts(post, 3);
  const existingConversationId =
    currentUser && !post.isOwner
      ? findConversationForUserAndPost(post.id, currentUser.id)
      : null;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 rounded-[2rem] border border-line bg-white/90 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
        <div className="space-y-5">
          <div className="relative h-72 overflow-hidden rounded-[1.8rem] bg-surface-strong sm:h-[28rem]">
            {post.imagePath ? (
              <Image
                src={post.imagePath}
                alt={post.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,rgba(255,111,20,0.14),rgba(37,99,235,0.14))] text-sm text-muted">
                Aucune image fournie
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-brand-soft px-4 py-2 text-sm font-semibold text-brand-strong">
              {post.type === "request" ? "Demande d'aide" : "Offre d'aide"}
            </span>
            <span className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted">
              {post.statusLabel}
            </span>
            <span className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted">
              {post.views} vues
            </span>
            {post.urgent ? (
              <span className="rounded-full bg-accent-soft px-4 py-2 text-sm font-semibold text-accent">
                Priorite haute
              </span>
            ) : null}
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted">
              {post.city} - {post.createdAt}
            </p>
            <h1 className="mt-3 font-serif text-4xl leading-tight text-foreground">
              {post.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-muted">
              {post.description}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-line bg-surface p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
                Publie par
              </p>
              <div className="mt-3 flex items-center gap-4">
                <UserAvatar
                  name={post.author}
                  avatarPath={post.authorAvatarPath}
                  size="lg"
                />
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {post.author}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Disponibilite : {post.availability || "A preciser"}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-surface p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
                Coordonnees
              </p>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {post.contactLabel}
              </p>
              {post.phoneLabel ? (
                <p className="mt-2 text-sm font-semibold text-foreground">
                  Tel : {post.phoneLabel}
                </p>
              ) : null}
              <p className="mt-2 text-sm leading-6 text-muted">
                {post.isOwner
                  ? "Tu vois ici tes coordonnees privees telles qu'elles sont stockees pour l'annonce."
                  : "Les coordonnees restent masquees publiquement. Passe par la messagerie pour faire la mise en relation."}
              </p>
            </div>
          </div>
        </div>

        <aside className="space-y-4 rounded-[1.75rem] border border-line bg-surface-strong p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              Categorie
            </p>
            <p className="mt-2 text-2xl font-serif text-foreground">
              {post.categoryLabel}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              Mots cles
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/90 px-3 py-1 text-sm text-muted"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-white/85 p-4">
            <p className="text-sm font-semibold text-foreground">
              Conseils de confiance
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
              <li>Verifie le lieu et le creneau dans le premier echange.</li>
              <li>Utilise la messagerie avant de partager une coordonnee directe.</li>
              <li>Change le statut de l&apos;annonce quand le besoin avance.</li>
            </ul>
          </div>

          {post.isOwner ? (
            <PostStatusControl postId={post.id} initialStatus={post.status} />
          ) : (
            <>
              {currentUser ? (
                <SavePostButton postId={post.id} initialSaved={post.isSaved} />
              ) : null}
              <StartConversationPanel
                postId={post.id}
                existingConversationId={existingConversationId}
                isAuthenticated={Boolean(currentUser)}
                loginHref={`/connexion?next=${encodeURIComponent(`/annonces/${post.slug}`)}`}
              />
            </>
          )}

          <div className="flex flex-col gap-3">
            <Link
              href="/deposer"
              className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-strong"
            >
              Publier une annonce
            </Link>
            <Link
              href="/annonces"
              className="inline-flex items-center justify-center rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-foreground hover:border-brand/35 hover:text-brand-strong"
            >
              Retour au catalogue
            </Link>
          </div>
        </aside>
      </section>

      <section className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
            A voir aussi
          </p>
          <h2 className="mt-2 font-serif text-3xl text-foreground">
            D&apos;autres annonces proches de ce besoin
          </h2>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {similarPosts.map((entry) => (
            <PostCard key={entry.id} post={entry} />
          ))}
        </div>
      </section>
    </div>
  );
}
