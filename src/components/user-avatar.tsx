import Image from "next/image";

type UserAvatarProps = {
  name: string;
  avatarPath?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizeClasses = {
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
} as const;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part.trim()[0] ?? "")
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserAvatar({
  name,
  avatarPath,
  size = "md",
}: UserAvatarProps) {
  const initials = getInitials(name) || "CM";

  return (
    <div
      className={`relative overflow-hidden rounded-full border border-line bg-brand-soft font-semibold text-brand-strong ${sizeClasses[size]}`}
    >
      {avatarPath ? (
        <Image
          src={avatarPath}
          alt={`Photo de profil de ${name}`}
          fill
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          {initials}
        </div>
      )}
    </div>
  );
}
