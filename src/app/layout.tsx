import type { Metadata } from "next";
import Script from "next/script";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoupDeMain",
  description:
    "La plateforme simple pour offrir ou demander de l'aide dans son quartier.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      data-accent="orange"
      suppressHydrationWarning
      className="h-full scroll-smooth"
    >
      <head>
        <Script id="accent-theme-init" strategy="beforeInteractive">
          {`try{var theme=localStorage.getItem("coupdemain-accent")||"orange";document.documentElement.dataset.accent=theme;}catch(e){document.documentElement.dataset.accent="orange";}`}
        </Script>
      </head>
      <body className="min-h-full bg-background text-foreground antialiased">
        <div className="relative flex min-h-screen flex-col overflow-x-hidden">
          <SiteHeader />
          <div className="app-shell-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem]" />
          <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-16 pt-8 sm:px-6 lg:px-8">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
