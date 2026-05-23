import Link from "next/link";

const footerLinks = [
  { href: "/annonces", label: "Annonces" },
  { href: "/deposer", label: "Deposer" },
  { href: "/tableau-de-bord", label: "Tableau de bord" },
  { href: "/connexion", label: "Connexion" },
  { href: "/inscription", label: "Inscription" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/70 bg-white/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className="font-serif text-2xl text-foreground">CoupDeMain</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Un MVP simple pour remettre en circulation l&apos;entraide locale,
            sans complexifier l&apos;usage.
          </p>
        </div>
        <nav className="flex flex-wrap gap-4 text-sm font-semibold text-foreground">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-brand-strong"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
