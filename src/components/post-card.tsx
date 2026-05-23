import Image from "next/image";
import Link from "next/link";
import { UserAvatar } from "@/components/user-avatar";
import type { CommunityPost } from "@/lib/types";

type PostCardProps = {
  post: CommunityPost;
};

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-line bg-white/85 card-shadow">
      <div className="relative h-52 bg-surface-strong">
        {post.imagePath ? (
          <Image
            src={post.imagePath}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,rgba(255,111,20,0.14),rgba(37,99,235,0.14))] p-6 text-center text-sm text-muted">
            Aucune image
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              post.type === "request"
                ? "bg-accent-soft text-accent"
                : "bg-brand-soft text-brand-strong"
            }`}
          >
            {post.type === "request" ? "Demande" : "Offre"}
          </span>
          <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-muted">
            {post.categoryLabel}
          </span>
          {post.urgent ? (
            <span className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-white">
              Urgent
            </span>
          ) : null}
        </div>

        <div className="mt-4">
          <p className="text-sm text-muted">
            {post.city} - {post.createdAt}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-foreground">
            {post.title}
          </h3>
          <p className="mt-3 line-clamp-4 text-sm leading-6 text-muted">
            {post.description}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-surface-strong px-3 py-1 text-xs text-muted"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <UserAvatar
              name={post.author}
              avatarPath={post.authorAvatarPath}
              size="sm"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">{post.author}</p>
              <p className="text-sm text-muted">{post.contactPreview}</p>
              <p className="text-xs text-muted/80">{post.views} vues</p>
            </div>
          </div>
          <Link
            href={`/annonces/${post.slug}`}
            className="inline-flex items-center justify-center rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-foreground hover:-translate-y-0.5 hover:border-brand/35 hover:text-brand-strong"
          >
            Voir l&apos;annonce
          </Link>
        </div>
      </div>
    </article>
  );
}
