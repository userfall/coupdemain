import Link from "next/link";
import { requireUser } from "@/lib/server/auth";
import { getUnreadMessageCount, listNotificationsForUser } from "@/lib/server/messaging";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const currentUser = await requireUser("/connexion?next=/notifications");
  const notifications = listNotificationsForUser(currentUser.id);
  const unreadCount = getUnreadMessageCount(currentUser.id);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-line bg-white/92 p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
          Notifications
        </p>
        <h1 className="mt-3 font-serif text-4xl text-foreground">
          Tout ce qui bouge dans ton espace
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Retrouve ici les messages non lus, les annonces qui attirent des vues et
          les rappels utiles pour reprendre un echange.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-line bg-surface p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
              Non lus
            </p>
            <p className="mt-3 font-serif text-4xl text-foreground">{unreadCount}</p>
          </div>
          <div className="rounded-[1.5rem] border border-line bg-surface p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
              Activites
            </p>
            <p className="mt-3 font-serif text-4xl text-foreground">
              {notifications.length}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-line bg-surface p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
              Raccourci
            </p>
            <Link
              href="/messages"
              className="mt-3 inline-flex rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
            >
              Ouvrir la messagerie
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        {notifications.map((notification) => (
          <Link
            key={notification.id}
            href={notification.href}
            className="rounded-[1.6rem] border border-line bg-white/88 p-5 hover:border-brand/25 hover:bg-white"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand-strong">
                    {notification.category === "message"
                      ? "Message"
                      : notification.category === "listing"
                        ? "Annonce"
                        : "Favori"}
                  </span>
                  {notification.unread ? (
                    <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
                      Nouveau
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-3 text-xl font-semibold text-foreground">
                  {notification.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-muted">
                  {notification.body}
                </p>
              </div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted">
                {notification.createdAtLabel}
              </p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
