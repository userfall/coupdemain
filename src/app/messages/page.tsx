import Link from "next/link";
import { redirect } from "next/navigation";
import { ConversationList } from "@/components/conversation-list";
import { requireUser } from "@/lib/server/auth";
import { getUnreadMessageCount, listConversationsForUser } from "@/lib/server/messaging";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const currentUser = await requireUser("/connexion?next=/messages");
  const conversations = listConversationsForUser(currentUser.id);
  const unreadCount = getUnreadMessageCount(currentUser.id);

  if (conversations.length > 0) {
    redirect(`/messages/${conversations[0].id}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <section className="rounded-[2rem] border border-line bg-white/90 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
          Messagerie
        </p>
        <h1 className="mt-3 font-serif text-4xl text-foreground">
          Tes conversations privees
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          Les contacts directs restent masques publiquement. Les echanges
          commencent ici, autour d&apos;une annonce.
        </p>
        <div className="mt-5 inline-flex rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-foreground">
          {unreadCount} message{unreadCount > 1 ? "s" : ""} non lu
          {unreadCount > 1 ? "s" : ""}
        </div>
        <div className="mt-6">
          <ConversationList conversations={conversations} />
        </div>
      </section>

      <section className="rounded-[2rem] border border-dashed border-line bg-white/80 px-6 py-12 text-center">
        <p className="text-lg font-semibold text-foreground">
          Aucune conversation pour le moment.
        </p>
        <p className="mt-3 text-sm leading-7 text-muted">
          Parcours une annonce et lance un premier message pour ouvrir un echange
          prive avec un autre membre.
        </p>
        <Link
          href="/annonces"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-strong"
        >
          Explorer les annonces
        </Link>
      </section>
    </div>
  );
}
