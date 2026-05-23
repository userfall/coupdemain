import { redirect } from "next/navigation";
import { CreatePostForm } from "@/components/forms/create-post-form";
import { SectionHeading } from "@/components/section-heading";
import { getCurrentUser } from "@/lib/server/auth";
import { getCategories } from "@/lib/server/marketplace";

export const dynamic = "force-dynamic";

export default async function DeposerPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/connexion?next=/deposer");
  }

  const categories = await getCategories();

  return (
    <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
      <section className="space-y-6 rounded-[2rem] border border-line bg-white/85 p-6">
        <SectionHeading
          eyebrow="Publication"
          title="Une annonce propre, claire et visible en quelques minutes."
          description="Tu es connecte, donc cette page enregistre vraiment les annonces. Image, description, ville et contact sont conserves dans la base locale."
        />

        <div className="space-y-4">
          {[
            "Choisis un titre concret et facile a comprendre.",
            "Ajoute une image pour rassurer et donner du contexte.",
            "Precise un vrai moyen de contact et une disponibilite.",
            "Une fois publiee, l'annonce apparait dans le catalogue public.",
          ].map((item, index) => (
            <div
              key={item}
              className="rounded-[1.4rem] border border-line bg-surface p-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-sm font-bold text-white">
                  0{index + 1}
                </span>
                <p className="text-sm leading-6 text-foreground">{item}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-[1.5rem] border border-accent/20 bg-accent-soft p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Connecte en tant que
          </p>
          <p className="mt-3 text-sm leading-6 text-foreground">
            {currentUser.displayName} - {currentUser.city}
          </p>
        </div>
      </section>

      <CreatePostForm categories={categories} currentUser={currentUser} />
    </div>
  );
}
