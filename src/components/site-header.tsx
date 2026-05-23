import Link from "next/link";
import { AccentThemeToggle } from "@/components/accent-theme-toggle";
import { DemoModeBadge } from "@/components/demo-mode-badge";
import { LogoutButton } from "@/components/logout-button";
import { NotificationPill } from "@/components/notification-pill";
import { UserAvatar } from "@/components/user-avatar";
import { getCurrentUser } from "@/lib/server/auth";
import { getUnreadMessageCount } from "@/lib/server/messaging";

const guestNavigation = [
  { href: "/", label: "Accueil" },
  { href: "/annonces", label: "Annonces" },
  { href: "/tableau-de-bord", label: "Apercu" },
];

const memberNavigation = [
  { href: "/", label: "Accueil" },
  { href: "/annonces", label: "Annonces" },
  { href: "/messages", label: "Messagerie" },
  { href: "/mon-espace", label: "Mon espace" },
  { href: "/deposer", label: "Publier" },
];

export async function SiteHeader() {
  const currentUser = await getCurrentUser();
  const navigation = currentUser ? memberNavigation : guestNavigation;
  const unreadCount = currentUser ? await getUnreadMessageCount(currentUser.id) : 0;

  return (
    <header className="sticky top-0 z-20 border-b border-white/80 bg-white/88 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] bg-brand text-lg font-bold text-white shadow-lg shadow-brand/20">
              CM
            </span>
            <div>
              <p className="font-serif text-2xl text-foreground">CoupDeMain</p>
              <p className="text-sm text-muted">
                annonces locales et entraide de quartier
              </p>
            </div>
          </Link>
          <DemoModeBadge />
        </div>

        <div className="flex flex-col gap-3 lg:min-w-[32rem] lg:items-end">
          <div className="hidden w-full max-w-[30rem] items-center gap-3 rounded-full border border-line bg-surface px-4 py-3 lg:flex">
            <span className="text-sm font-semibold text-muted">Recherche rapide</span>
            <div className="h-5 w-px bg-line" />
            <Link
              href="/annonces"
              className="text-sm text-foreground hover:text-brand-strong"
            >
              Meuble, transport, administratif...
            </Link>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 hover:bg-surface-strong hover:text-brand-strong"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <AccentThemeToggle />
            {currentUser ? (
              <>
                <NotificationPill
                  href="/notifications"
                  label="Notifications"
                  count={unreadCount}
                />
                <div className="flex items-center gap-3 rounded-full bg-surface px-3 py-2 text-sm text-muted">
                  <UserAvatar
                    name={currentUser.displayName}
                    avatarPath={currentUser.avatarPath}
                    size="sm"
                  />
                  <span>Bonjour {currentUser.displayName}</span>
                </div>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link
                  href="/connexion"
                  className="rounded-full border border-line bg-white px-4 py-2.5 text-sm font-semibold text-foreground hover:-translate-y-0.5 hover:border-brand/30 hover:text-brand-strong"
                >
                  Connexion
                </Link>
                <Link
                  href="/inscription"
                  className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/20 hover:-translate-y-0.5 hover:bg-brand-strong"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
