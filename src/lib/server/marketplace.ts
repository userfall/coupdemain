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

export function getCategories() {
  noStore();
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

export function listPosts(limit?: number) {
  noStore();
  return listRows(limit).map(mapPostRow);
}

export function getFeaturedPosts() {
  return listPosts(3);
}

export function getPostDetailBySlug(slug: string, viewerId?: string | null) {
  noStore();
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

export function listSimilarPosts(post: CommunityPost, limit = 3) {
  noStore();
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

export function listPostsByUser(userId: string) {
  noStore();
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

export function listSavedPosts(userId: string) {
  noStore();
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

export function getMarketplaceStats() {
  noStore();
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
  const database = getDatabase();
  const category = database
    .prepare("select slug from categories where slug = ? limit 1")
    .get<{ slug: string }>(input.category);

  if (!category) {
    throw new Error("Categorie introuvable.");
  }

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

export function incrementPostViews(postId: string) {
  const database = getDatabase();
  database.prepare("update posts set views = views + 1 where id = ?").run(postId);
}

export function toggleSavedPost(userId: string, postId: string) {
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

export function updatePostStatus(
  userId: string,
  postId: string,
  status: PostStatus,
) {
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
