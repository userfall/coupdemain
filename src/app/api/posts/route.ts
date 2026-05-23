import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/server/auth";
import { createPost } from "@/lib/server/marketplace";

export async function POST(request: Request) {
  const user = await getRequestUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Merci de vous connecter pour publier." },
      { status: 401 },
    );
  }

  const formData = await request.formData();

  try {
    const result = await createPost({
      userId: user.id,
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      type: String(formData.get("type") ?? "request") === "offer" ? "offer" : "request",
      category: String(formData.get("category") ?? ""),
      city: String(formData.get("city") ?? ""),
      contact: String(formData.get("contact") ?? user.email),
      phoneNumber: String(formData.get("phoneNumber") ?? ""),
      availability: String(formData.get("availability") ?? ""),
      urgent: String(formData.get("urgent") ?? "") === "true",
      tags: String(formData.get("tags") ?? ""),
      image:
        formData.get("image") instanceof File ? (formData.get("image") as File) : null,
    });

    return NextResponse.json({
      ok: true,
      slug: result.slug,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "La publication n'a pas pu etre enregistree.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
