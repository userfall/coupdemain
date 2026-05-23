import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/server/auth";
import { toggleSavedPost } from "@/lib/server/marketplace";

type SaveRouteProps = {
  params: Promise<{
    postId: string;
  }>;
};

export async function POST(request: Request, { params }: SaveRouteProps) {
  const user = await getRequestUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Merci de vous connecter pour sauvegarder cette annonce." },
      { status: 401 },
    );
  }

  const { postId } = await params;

  try {
    const result = await toggleSavedPost(user.id, postId);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Impossible de mettre a jour les favoris.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
