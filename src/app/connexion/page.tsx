import { redirect } from "next/navigation";
import { AuthExperience } from "@/components/auth-experience";
import { DEMO_ACCOUNT, getCurrentUser } from "@/lib/server/auth";

type ConnexionPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function ConnexionPage({
  searchParams,
}: ConnexionPageProps) {
  const currentUser = await getCurrentUser();
  const { next } = await searchParams;
  const nextPath = next && next.startsWith("/") ? next : "/mon-espace";

  if (currentUser) {
    redirect(nextPath);
  }

  return (
    <AuthExperience
      mode="signin"
      nextPath={nextPath}
      demoEmail={DEMO_ACCOUNT.email}
      demoPassword={DEMO_ACCOUNT.password}
    />
  );
}
