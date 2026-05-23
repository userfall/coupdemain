import Link from "next/link";

type NotificationPillProps = {
  href: string;
  label: string;
  count?: number;
};

export function NotificationPill({
  href,
  label,
  count = 0,
}: NotificationPillProps) {
  return (
    <Link
      href={href}
      className="relative inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-sm font-semibold text-foreground hover:border-brand/30 hover:text-brand-strong"
    >
      <span>{label}</span>
      {count > 0 ? (
        <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
