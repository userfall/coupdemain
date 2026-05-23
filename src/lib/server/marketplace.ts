import { randomUUID } from "node:crypto";
import { unstable_noStore as noStore } from "next/cache";
import { formatRelativeTime, maskContact, maskPhone } from "@/lib/formatters";
import type {
  Category,
  CommunityPost,
  MarketplaceStats,
  PostDetailView,
  PostStatus,
} from "@/lib/types";
import { getDatabase } from "@/lib/server/db";
import { ensureSupabaseInitialized } from "@/lib/server/supabase-init";
import {
  isSupabaseServerConfigured,
  isMissingRowError,
  requireSupabaseAdmin,
} from "@/lib/server/supabase-admin";
import { saveImageFile } from "@/lib/server/uploads";

type PostRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: "request" | "offer";
  category_slug: string;
  category_name: string;
  city: string;
  author_name: string;
  author_id: string;
  author_avatar_path: string | null;
  contact: string;
  phone_number: string | null;
  availability: string;
  created_at: string;
  status: PostStatus;
  urgent: number;
  tags: string;
  image_path: string | null;
  views: number;
};

type CategoryRow = {
  slug: string;
  name: string;
  description: string;
  tint: string;
  text_color: string;
  count: number;
};

type StatRow = {
  active_posts: number;
  users: number;
  cities: number;
  resolved_posts: number;
};

type CreatePostInput = {
  userId: string;
  title: string;
  description: string;
  type: "request" | "offer";
  category: string;
  city: string;
  contact: string;
  phoneNumber: string;
  availability: string;
  urgent: boolean;
  tags: string;
  image: File | null;
};

type SupabaseCategory = {
  slug: string;
  name: string;
  description: string;
  tint: string;
  text_color: string;
};

type SupabaseUser = {
  id: string;
  display_name: string;
  city: string;
  avatar_path: string | null;
};

type SupabasePost = {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  description: string;
  type: "request" | "offer";
  category_slug: string;
  status: PostStatus;
  city: string;
  contact: string;
  phone_number: string | null;
  availability: string;
  urgent: boolean;
  tags: string;
  image_path: string | null;
  views: number;
  created_at: string;
  users: SupabaseUser | SupabaseUser[] | null;
  categories: Pick<SupabaseCategory, "slug" | "name"> | Pick<SupabaseCategory, "slug" | "name">[] | null;
};

function statusLabel(status: PostStatus) {
  if (status === "matched") {
    return "En cours";
  }

  if (status === "resolved") {
    return "Resolue";
  }

  return "Ouverte";
}

function normalizeTags(input: string) {
  return input
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 5);
}

function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 70);
}

function normalizePhoneNumber(input: string) {
  return input.trim();
}

function mapPostRow(row: PostRow): CommunityPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    type: row.type,
    category: row.category_slug,
    categoryLabel: row.category_name,
    city: row.city,
    author: row.author_name,
    authorId: row.author_id,
    authorAvatarPath: row.author_avatar_path,
    contactPreview: maskContact(row.contact),
    phonePreview: row.phone_number ? maskPhone(row.phone_number) : null,
    availability: row.availability,
    createdAt: formatRelativeTime(row.created_at),
    createdAtISO: row.created_at,
    status: row.status,
    statusLabel: statusLabel(row.status),
    urgent: Boolean(row.urgent),
    tags: row.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    imagePath: row.image_path,
    views: Number(row.views ?? 0),
  };
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function mapSupabasePostRow(row: SupabasePost): PostRow {
  const user = firstRelation(row.users);
  const category = firstRelation(row.categories);

  if (!user || !category) {
    throw new Error("Relation Supabase incomplete pour une annonce.");
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    type: row.type,
    category_slug: row.category_slug,
    category_name: category.name,
    city: row.city,
    author_name: user.display_name,
    author_id: user.id,
    author_avatar_path: user.avatar_path,
    contact: row.contact,
    phone_number: row.phone_number,
    availability: row.availability,
    created_at: row.created_at,
    status: row.status,
    urgent: row.urgent ? 1 : 0,
    tags: row.tags,
    image_path: row.image_path,
    views: Number(row.views ?? 0),
  };
}

async function listSupabasePostRows(limit?: number) {
  await ensureSupabaseInitialized();
  const supabase = requireSupabaseAdmin();
  let query = supabase
    .from("posts")
    .select(`
      id,
      user_id,
      slug,
      title,
      description,
      type,
      category_slug,
      status,
      city,
      contact,
      phone_number,
      availability,
      urgent,
      tags,
      image_path,
      views,
      created_at,
      users!posts_user_id_fkey (
        id,
        display_name,
        city,
        avatar_path
      ),
      categories!posts_category_slug_fkey (
        slug,
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Impossible de lire les annonces: ${error.message}`);
  }

  return (data ?? []).map((row) => mapSupabasePostRow(row as SupabasePost));
}

async function buildUniqueSlugSupabase(title: string, city: string) {
  await ensureSupabaseInitialized();
  const supabase = requireSupabaseAdmin();
  const base = slugify(`${title}-${city}`) || randomUUID().slice(0, 8);
  let candidate = base;
  let index = 2;

  while (true) {
    const { data, error } = await supabase
      .from("posts")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle<{ id: string }>();

    if (error && !isMissingRowError(error)) {
      throw new Error(`Impossible de verifier le slug: ${error.message}`);
    }

    if (!data) {
      return candidate;
    }

    candidate = `${base}-${index}`;
    index += 1;
  }
}

function buildUniqueSlug(title: string, city: string) {
  const database = getDatabase();
  const base = slugify(`${title}-${city}`) || randomUUID().slice(0, 8);
  let candidate = base;
  let index = 2;

  while (
    database.prepare("select 1 as count from posts where slug = ?").get(candidate)
  ) {
    candidate = `${base}-${index}`;
    index += 1;
  }

  return candidate;
}

function listRows(limit?: number) {
  const database = getDatabase();
  const sql = `
    select
      posts.id,
      posts.slug,
      posts.title,
      posts.description,
      posts.type,
      posts.category_slug,
      categories.name as category_name,
      posts.city,
      users.display_name as author_name,
      users.id as author_id,
      users.avatar_path as author_avatar_path,
      posts.contact,
      posts.phone_number,
      posts.availability,
      posts.created_at,
      posts.status,
      posts.urgent,
      posts.tags,
      posts.image_path,
      posts.views
    from posts
    join users on users.id = posts.user_id
    join categories on categories.slug = posts.category_slug
    order by datetime(posts.created_at) desc
    ${limit ? "limit ?" : ""}
  `;

  return limit
    ? database.prepare(sql).all<PostRow>(limit)
    : database.prepare(sql).all<PostRow>();
}

export async function getCategories() {
  noStore();

  if (isSupabaseServerConfigured) {
    await ensureSupabaseInitialized();
    const supabase = requireSupabaseAdmin();
    const [{ data: categories, error: categoryError }, { data: posts, error: postError }] =
      await Promise.all([
        supabase.from("categories").select("*").order("name", { ascending: true }),
        supabase
          .from("posts")
          .select("category_slug")
          .eq("status", "open"),
      ]);

    if (categoryError) {
      throw new Error(`Impossible de lire les categories: ${categoryError.message}`);
    }

    if (postError) {
      throw new Error(`Impossible de lire les compteurs: ${postError.message}`);
    }

    const counts = new Map<string, number>();

    for (const post of posts ?? []) {
      counts.set(post.category_slug, (counts.get(post.category_slug) ?? 0) + 1);
    }

    return (categories ?? []).map((row) => ({
      slug: row.slug,
      name: row.name,
      description: row.description,
      count: counts.get(row.slug) ?? 0,
      tint: row.tint,
      textColor: row.text_color,
    })) satisfies Category[];
  }

  const database = getDatabase();
  const rows = database
    .prepare(`
      select
        categories.slug,
        categories.name,
        categories.description,
        categories.tint,
        categories.text_color,
        count(posts.id) as count
      from categories
      left join posts on posts.category_slug = categories.slug and posts.status = 'open'
      group by categories.slug
      order by categories.name asc
    `)
    .all<CategoryRow>();

  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    description: row.description,
    count: Number(row.count),
    tint: row.tint,
    textColor: row.text_color,
  })) satisfies Category[];
}

export async function listPosts(limit?: number) {
  noStore();

  const rows = isSupabaseServerConfigured
    ? await listSupabasePostRows(limit)
    : listRows(limit);

  return rows.map(mapPostRow);
}

export async function getFeaturedPosts() {
  return listPosts(3);
}

export async function getPostDetailBySlug(slug: string, viewerId?: string | null) {
  noStore();

  if (isSupabaseServerConfigured) {
    await ensureSupabaseInitialized();
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase
      .from("posts")
      .select(`
        id,
        user_id,
        slug,
        title,
        description,
        type,
        category_slug,
        status,
        city,
        contact,
        phone_number,
        availability,
        urgent,
        tags,
        image_path,
        views,
        created_at,
        users!posts_user_id_fkey (
          id,
          display_name,
          city,
          avatar_path
        ),
        categories!posts_category_slug_fkey (
          slug,
          name
        )
      `)
      .eq("slug", slug)
      .maybeSingle<SupabasePost>();

    if (error && !isMissingRowError(error)) {
      throw new Error(`Impossible de lire l'annonce: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const row = mapSupabasePostRow(data);
    const basePost = mapPostRow(row);
    const isOwner = Boolean(viewerId && viewerId === row.author_id);
    let isSaved = false;

    if (viewerId) {
      const { data: savedRow, error: savedError } = await supabase
        .from("saved_posts")
        .select("post_id")
        .eq("user_id", viewerId)
        .eq("post_id", row.id)
        .maybeSingle<{ post_id: string }>();

      if (savedError && !isMissingRowError(savedError)) {
        throw new Error(`Impossible de lire les favoris: ${savedError.message}`);
      }

      isSaved = Boolean(savedRow);
    }

    return {
      ...basePost,
      contactLabel: isOwner ? row.contact : maskContact(row.contact),
      phoneLabel: row.phone_number
        ? isOwner
          ? row.phone_number
          : maskPhone(row.phone_number)
        : null,
      isOwner,
      isSaved,
    } satisfies PostDetailView;
  }

  const database = getDatabase();
  const row = database
    .prepare(`
      select
        posts.id,
        posts.slug,
        posts.title,
        posts.description,
        posts.type,
        posts.category_slug,
        categories.name as category_name,
        posts.city,
        users.display_name as author_name,
        users.id as author_id,
        users.avatar_path as author_avatar_path,
        posts.contact,
        posts.phone_number,
        posts.availability,
        posts.created_at,
        posts.status,
        posts.urgent,
        posts.tags,
        posts.image_path,
        posts.views
      from posts
      join users on users.id = posts.user_id
      join categories on categories.slug = posts.category_slug
      where posts.slug = ?
      limit 1
    `)
    .get<PostRow>(slug);

  if (!row) {
    return null;
  }

  const basePost = mapPostRow(row);
  const isOwner = Boolean(viewerId && viewerId === row.author_id);
  const isSaved = viewerId
    ? Boolean(
        database
          .prepare("select 1 as count from saved_posts where user_id = ? and post_id = ?")
          .get(viewerId, row.id),
      )
    : false;

  return {
    ...basePost,
    contactLabel: isOwner ? row.contact : maskContact(row.contact),
    phoneLabel: row.phone_number
      ? isOwner
        ? row.phone_number
        : maskPhone(row.phone_number)
      : null,
    isOwner,
    isSaved,
  } satisfies PostDetailView;
}

export async function listSimilarPosts(post: CommunityPost, limit = 3) {
  noStore();

  if (isSupabaseServerConfigured) {
    const rows = await listSupabasePostRows();
    return rows
      .filter(
        (row) =>
          row.slug !== post.slug &&
          (row.category_slug === post.category || row.city === post.city),
      )
      .slice(0, limit)
      .map(mapPostRow);
  }

  const database = getDatabase();
  const rows = database
    .prepare(`
      select
        posts.id,
        posts.slug,
        posts.title,
        posts.description,
        posts.type,
        posts.category_slug,
        categories.name as category_name,
        posts.city,
        users.display_name as author_name,
        users.id as author_id,
        users.avatar_path as author_avatar_path,
        posts.contact,
        posts.phone_number,
        posts.availability,
        posts.created_at,
        posts.status,
        posts.urgent,
        posts.tags,
        posts.image_path,
        posts.views
      from posts
      join users on users.id = posts.user_id
      join categories on categories.slug = posts.category_slug
      where posts.slug != ?
        and (posts.category_slug = ? or posts.city = ?)
      order by datetime(posts.created_at) desc
      limit ?
    `)
    .all<PostRow>(post.slug, post.category, post.city, limit);

  return rows.map(mapPostRow);
}

export async function listPostsByUser(userId: string) {
  noStore();

  if (isSupabaseServerConfigured) {
    await ensureSupabaseInitialized();
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase
      .from("posts")
      .select(`
        id,
        user_id,
        slug,
        title,
        description,
        type,
        category_slug,
        status,
        city,
        contact,
        phone_number,
        availability,
        urgent,
        tags,
        image_path,
        views,
        created_at,
        users!posts_user_id_fkey (
          id,
          display_name,
          city,
          avatar_path
        ),
        categories!posts_category_slug_fkey (
          slug,
          name
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Impossible de lire les annonces du membre: ${error.message}`);
    }

    return (data ?? []).map((row) => mapPostRow(mapSupabasePostRow(row as SupabasePost)));
  }

  const database = getDatabase();
  const rows = database
    .prepare(`
      select
        posts.id,
        posts.slug,
        posts.title,
        posts.description,
        posts.type,
        posts.category_slug,
        categories.name as category_name,
        posts.city,
        users.display_name as author_name,
        users.id as author_id,
        users.avatar_path as author_avatar_path,
        posts.contact,
        posts.phone_number,
        posts.availability,
        posts.created_at,
        posts.status,
        posts.urgent,
        posts.tags,
        posts.image_path,
        posts.views
      from posts
      join users on users.id = posts.user_id
      join categories on categories.slug = posts.category_slug
      where posts.user_id = ?
      order by datetime(posts.created_at) desc
    `)
    .all<PostRow>(userId);

  return rows.map(mapPostRow);
}

export async function listSavedPosts(userId: string) {
  noStore();

  if (isSupabaseServerConfigured) {
    await ensureSupabaseInitialized();
    const supabase = requireSupabaseAdmin();
    const { data: savedRows, error: savedError } = await supabase
      .from("saved_posts")
      .select("post_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (savedError) {
      throw new Error(`Impossible de lire les favoris: ${savedError.message}`);
    }

    const postIds = (savedRows ?? []).map((row) => row.post_id);

    if (postIds.length === 0) {
      return [];
    }

    const { data: posts, error } = await supabase
      .from("posts")
      .select(`
        id,
        user_id,
        slug,
        title,
        description,
        type,
        category_slug,
        status,
        city,
        contact,
        phone_number,
        availability,
        urgent,
        tags,
        image_path,
        views,
        created_at,
        users!posts_user_id_fkey (
          id,
          display_name,
          city,
          avatar_path
        ),
        categories!posts_category_slug_fkey (
          slug,
          name
        )
      `)
      .in("id", postIds);

    if (error) {
      throw new Error(`Impossible de lire les annonces favorites: ${error.message}`);
    }

    const order = new Map(postIds.map((id, index) => [id, index]));

    return (posts ?? [])
      .map((row) => mapPostRow(mapSupabasePostRow(row as SupabasePost)))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }

  const database = getDatabase();
  const rows = database
    .prepare(`
      select
        posts.id,
        posts.slug,
        posts.title,
        posts.description,
        posts.type,
        posts.category_slug,
        categories.name as category_name,
        posts.city,
        users.display_name as author_name,
        users.id as author_id,
        users.avatar_path as author_avatar_path,
        posts.contact,
        posts.phone_number,
        posts.availability,
        posts.created_at,
        posts.status,
        posts.urgent,
        posts.tags,
        posts.image_path,
        posts.views
      from saved_posts
      join posts on posts.id = saved_posts.post_id
      join users on users.id = posts.user_id
      join categories on categories.slug = posts.category_slug
      where saved_posts.user_id = ?
      order by datetime(saved_posts.created_at) desc
    `)
    .all<PostRow>(userId);

  return rows.map(mapPostRow);
}

export async function getMarketplaceStats() {
  noStore();

  if (isSupabaseServerConfigured) {
    await ensureSupabaseInitialized();
    const supabase = requireSupabaseAdmin();
    const [{ data: posts, error: postError }, { count: userCount, error: userError }] =
      await Promise.all([
        supabase.from("posts").select("status, city"),
        supabase.from("users").select("id", { count: "exact", head: true }),
      ]);

    if (postError) {
      throw new Error(`Impossible de lire les stats annonces: ${postError.message}`);
    }

    if (userError) {
      throw new Error(`Impossible de lire les stats membres: ${userError.message}`);
    }

    const rows = posts ?? [];

    return {
      activePosts: rows.filter((row) => row.status === "open").length,
      users: Number(userCount ?? 0),
      cities: new Set(rows.map((row) => row.city)).size,
      resolvedPosts: rows.filter((row) => row.status === "resolved").length,
    } satisfies MarketplaceStats;
  }

  const database = getDatabase();
  const row = database
    .prepare(`
      select
        sum(case when status = 'open' then 1 else 0 end) as active_posts,
        (select count(*) from users) as users,
        (select count(distinct city) from posts) as cities,
        sum(case when status = 'resolved' then 1 else 0 end) as resolved_posts
      from posts
    `)
    .get<StatRow>();

  return {
    activePosts: Number(row?.active_posts ?? 0),
    users: Number(row?.users ?? 0),
    cities: Number(row?.cities ?? 0),
    resolvedPosts: Number(row?.resolved_posts ?? 0),
  } satisfies MarketplaceStats;
}

export async function createPost(input: CreatePostInput) {
  const title = input.title.trim();
  const description = input.description.trim();
  const city = input.city.trim();
  const contact = input.contact.trim();
  const phoneNumber = normalizePhoneNumber(input.phoneNumber);

  if (title.length < 8) {
    throw new Error("Le titre doit contenir au moins 8 caracteres.");
  }

  if (description.length < 30) {
    throw new Error("La description doit etre plus detaillee.");
  }

  if (city.length < 2) {
    throw new Error("Merci d'indiquer une ville.");
  }

  if (contact.length < 5) {
    throw new Error("Merci d'indiquer un email de contact prive.");
  }

  if (phoneNumber) {
    const phoneDigits = phoneNumber.replace(/\D/g, "");

    if (phoneDigits.length < 8) {
      throw new Error("Le numero de telephone semble incomplet.");
    }
  }

  if (isSupabaseServerConfigured) {
    await ensureSupabaseInitialized();
    const supabase = requireSupabaseAdmin();
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("slug")
      .eq("slug", input.category)
      .maybeSingle<{ slug: string }>();

    if (categoryError && !isMissingRowError(categoryError)) {
      throw new Error(`Impossible de verifier la categorie: ${categoryError.message}`);
    }

    if (!category) {
      throw new Error("Categorie introuvable.");
    }

    const imagePath = await saveImageFile({ file: input.image, folder: "uploads" });
    const slug = await buildUniqueSlugSupabase(title, city);
    const tagList = normalizeTags(input.tags);
    const createdAt = new Date().toISOString();
    const postId = randomUUID();
    const { error } = await supabase.from("posts").insert({
      id: postId,
      user_id: input.userId,
      slug,
      type: input.type,
      category_slug: input.category,
      status: "open",
      title,
      description,
      city,
      contact,
      phone_number: phoneNumber || null,
      availability: input.availability.trim(),
      urgent: input.urgent,
      tags: tagList.join(","),
      image_path: imagePath,
      views: 0,
      created_at: createdAt,
    });

    if (error) {
      throw new Error(`Impossible d'enregistrer l'annonce: ${error.message}`);
    }

    return { id: postId, slug };
  }

  const database = getDatabase();
  const category = database
    .prepare("select slug from categories where slug = ? limit 1")
    .get<{ slug: string }>(input.category);

  if (!category) {
    throw new Error("Categorie introuvable.");
  }

  const imagePath = await saveImageFile({ file: input.image, folder: "uploads" });
  const slug = buildUniqueSlug(title, city);
  const tagList = normalizeTags(input.tags);
  const createdAt = new Date().toISOString();
  const postId = randomUUID();

  database
    .prepare(`
      insert into posts (
        id,
        user_id,
        slug,
        type,
        category_slug,
        status,
        title,
        description,
        city,
        contact,
        phone_number,
        availability,
        urgent,
        tags,
        image_path,
        views,
        created_at
      )
      values (?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `)
    .run(
      postId,
      input.userId,
      slug,
      input.type,
      input.category,
      title,
      description,
      city,
      contact,
      phoneNumber || null,
      input.availability.trim(),
      input.urgent ? 1 : 0,
      tagList.join(","),
      imagePath,
      createdAt,
    );

  return { id: postId, slug };
}

export async function incrementPostViews(postId: string) {
  if (isSupabaseServerConfigured) {
    await ensureSupabaseInitialized();
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase
      .from("posts")
      .select("views")
      .eq("id", postId)
      .maybeSingle<{ views: number }>();

    if (error && !isMissingRowError(error)) {
      throw new Error(`Impossible de lire les vues: ${error.message}`);
    }

    const nextViews = Number(data?.views ?? 0) + 1;
    const { error: updateError } = await supabase
      .from("posts")
      .update({ views: nextViews })
      .eq("id", postId);

    if (updateError) {
      throw new Error(`Impossible de mettre a jour les vues: ${updateError.message}`);
    }

    return;
  }

  const database = getDatabase();
  database.prepare("update posts set views = views + 1 where id = ?").run(postId);
}

export async function toggleSavedPost(userId: string, postId: string) {
  if (isSupabaseServerConfigured) {
    await ensureSupabaseInitialized();
    const supabase = requireSupabaseAdmin();
    const { data: existing, error } = await supabase
      .from("saved_posts")
      .select("post_id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .maybeSingle<{ post_id: string }>();

    if (error && !isMissingRowError(error)) {
      throw new Error(`Impossible de lire les favoris: ${error.message}`);
    }

    if (existing) {
      const { error: deleteError } = await supabase
        .from("saved_posts")
        .delete()
        .eq("user_id", userId)
        .eq("post_id", postId);

      if (deleteError) {
        throw new Error(`Impossible de retirer le favori: ${deleteError.message}`);
      }

      return { saved: false };
    }

    const { error: insertError } = await supabase.from("saved_posts").insert({
      user_id: userId,
      post_id: postId,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      throw new Error(`Impossible d'ajouter le favori: ${insertError.message}`);
    }

    return { saved: true };
  }

  const database = getDatabase();
  const existing = database
    .prepare("select 1 as count from saved_posts where user_id = ? and post_id = ?")
    .get(userId, postId);

  if (existing) {
    database
      .prepare("delete from saved_posts where user_id = ? and post_id = ?")
      .run(userId, postId);

    return { saved: false };
  }

  database
    .prepare(`
      insert into saved_posts (user_id, post_id, created_at)
      values (?, ?, ?)
    `)
    .run(userId, postId, new Date().toISOString());

  return { saved: true };
}

export async function updatePostStatus(
  userId: string,
  postId: string,
  status: PostStatus,
) {
  if (isSupabaseServerConfigured) {
    await ensureSupabaseInitialized();
    const supabase = requireSupabaseAdmin();
    const { data: post, error } = await supabase
      .from("posts")
      .select("id")
      .eq("id", postId)
      .eq("user_id", userId)
      .maybeSingle<{ id: string }>();

    if (error && !isMissingRowError(error)) {
      throw new Error(`Impossible de verifier l'annonce: ${error.message}`);
    }

    if (!post) {
      throw new Error("Annonce introuvable ou non autorisee.");
    }

    const { error: updateError } = await supabase
      .from("posts")
      .update({ status })
      .eq("id", postId);

    if (updateError) {
      throw new Error(`Impossible de changer le statut: ${updateError.message}`);
    }

    return { ok: true };
  }

  const database = getDatabase();
  const post = database
    .prepare("select id from posts where id = ? and user_id = ? limit 1")
    .get<{ id: string }>(postId, userId);

  if (!post) {
    throw new Error("Annonce introuvable ou non autorisee.");
  }

  database
    .prepare("update posts set status = ? where id = ?")
    .run(status, postId);

  return { ok: true };
}
