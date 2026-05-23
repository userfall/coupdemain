import { redirect } from "next/navigation";
import { AuthExperience } from "@/components/auth-experience";
import { DEMO_ACCOUNT, getCurrentUser } from "@/lib/server/auth";

type InscriptionPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function InscriptionPage({
  searchParams,
}: InscriptionPageProps) {
  const currentUser = await getCurrentUser();
  const { next } = await searchParams;
  const nextPath = next && next.startsWith("/") ? next : "/mon-espace";

  if (currentUser) {
    redirect(nextPath);
  }

  return (
    <AuthExperience
      mode="signup"
      nextPath={nextPath}
      demoEmail={DEMO_ACCOUNT.email}
      demoPassword={DEMO_ACCOUNT.password}
    />
  );
}
