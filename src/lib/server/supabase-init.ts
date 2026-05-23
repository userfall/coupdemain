import {
  CATEGORY_SEEDS,
  hashSeedPassword,
  seedPosts,
  seedUsers,
} from "@/lib/server/db";
import {
  isSupabaseServerConfigured,
  requireSupabaseAdmin,
} from "@/lib/server/supabase-admin";

let initializationPromise: Promise<void> | null = null;

function normalizeIsoTimestamp(value: string) {
  return new Date(value).toISOString();
}

export async function ensureSupabaseInitialized() {
  if (!isSupabaseServerConfigured) {
    return;
  }

  if (!initializationPromise) {
    initializationPromise = (async () => {
      const supabase = requireSupabaseAdmin();

      const { count: categoryCount, error: categoryError } = await supabase
        .from("categories")
        .select("slug", { count: "exact", head: true });

      if (categoryError) {
        throw new Error(
          "Supabase n'est pas pret. Lance d'abord le SQL de supabase/schema.sql.",
        );
      }

      if ((categoryCount ?? 0) === 0) {
        const { error } = await supabase.from("categories").insert(CATEGORY_SEEDS.map(
          (category) => ({
            slug: category.slug,
            name: category.name,
            description: category.description,
            tint: category.tint,
            text_color: category.textColor,
          }),
        ));

        if (error) {
          throw new Error(`Impossible de creer les categories: ${error.message}`);
        }
      }

      const { count: userCount, error: userError } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true });

      if (userError) {
        throw new Error(`Impossible de verifier les membres: ${userError.message}`);
      }

      if ((userCount ?? 0) === 0) {
        const { error } = await supabase.from("users").insert(
          seedUsers.map((user) => ({
            id: user.id,
            email: user.email,
            display_name: user.displayName,
            city: user.city,
            avatar_path: user.avatarPath ?? null,
            password_hash: hashSeedPassword(user.password),
            created_at: normalizeIsoTimestamp("2026-05-01T09:00:00.000Z"),
          })),
        );

        if (error) {
          throw new Error(`Impossible de creer les membres de demo: ${error.message}`);
        }
      }

      const { count: postCount, error: postError } = await supabase
        .from("posts")
        .select("id", { count: "exact", head: true });

      if (postError) {
        throw new Error(`Impossible de verifier les annonces: ${postError.message}`);
      }

      if ((postCount ?? 0) === 0) {
        const { error } = await supabase.from("posts").insert(
          seedPosts.map((post) => ({
            id: post.id,
            user_id: post.userId,
            slug: post.slug,
            type: post.type,
            category_slug: post.categorySlug,
            status: "open",
            title: post.title,
            description: post.description,
            city: post.city,
            contact: post.contact,
            phone_number: post.phoneNumber,
            availability: post.availability,
            urgent: Boolean(post.urgent),
            tags: post.tags,
            image_path: post.imagePath,
            views: post.views,
            created_at: normalizeIsoTimestamp(post.createdAt),
          })),
        );

        if (error) {
          throw new Error(`Impossible de creer les annonces de demo: ${error.message}`);
        }
      }
    })();
  }

  await initializationPromise;
}
