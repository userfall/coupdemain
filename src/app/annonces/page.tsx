import Link from "next/link";
import { PostDirectory } from "@/components/post-directory";
import { SectionHeading } from "@/components/section-heading";
import { getCategories, listPosts } from "@/lib/server/marketplace";

export const dynamic = "force-dynamic";

export default function AnnoncesPage() {
  const posts = listPosts();
  const categories = getCategories();

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-line bg-white/85 p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Catalogue"
            title="Toutes les annonces publiees dans la plateforme"
            description="Cette page lit maintenant les vraies donnees de la base locale : comptes, publications, images, coordonnees masquees, messagerie et filtres actifs."
          />
          <Link
            href="/deposer"
            className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-strong"
          >
            Publier une annonce
          </Link>
        </div>
      </section>

      <PostDirectory posts={posts} categories={categories} />
    </div>
  );
}
