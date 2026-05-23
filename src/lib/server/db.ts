import { randomUUID, scryptSync } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getDatabaseDirectory, getMediaDirectory } from "@/lib/server/storage";

type DatabaseGlobal = typeof globalThis & {
  __coupdemainDb?: DatabaseSync;
};

type CategorySeed = {
  slug: string;
  name: string;
  description: string;
  tint: string;
  textColor: string;
};

type UserSeed = {
  id: string;
  email: string;
  displayName: string;
  city: string;
  password: string;
  avatarPath?: string | null;
};

type PostSeed = {
  id: string;
  userId: string;
  slug: string;
  type: "request" | "offer";
  categorySlug: string;
  title: string;
  description: string;
  city: string;
  contact: string;
  phoneNumber: string;
  availability: string;
  urgent: number;
  tags: string;
  imagePath: string;
  createdAt: string;
  views: number;
};

type CountRow = {
  count: number;
};

export const CATEGORY_SEEDS: CategorySeed[] = [
  {
    slug: "entraide-pratique",
    name: "Entraide pratique",
    description: "Montage, demenagement, rangement et coup de main du quotidien.",
    tint: "#fff1e6",
    textColor: "#ea580c",
  },
  {
    slug: "courses-transport",
    name: "Courses et transport",
    description: "Courses, petits trajets, colis et accompagnements utiles.",
    tint: "#dcfce7",
    textColor: "#166534",
  },
  {
    slug: "numerique-administratif",
    name: "Numerique et administratif",
    description: "Dossiers en ligne, mails, impressions et aide pratique.",
    tint: "#dbeafe",
    textColor: "#1d4ed8",
  },
  {
    slug: "education-soutien",
    name: "Education et soutien",
    description: "Devoirs, revision, langue et coup de pouce scolaire.",
    tint: "#ede9fe",
    textColor: "#6d28d9",
  },
  {
    slug: "bien-etre-presence",
    name: "Presence et bien-etre",
    description: "Visite, lecture, ecoute et presence rassurante.",
    tint: "#fce7f3",
    textColor: "#be185d",
  },
  {
    slug: "objets-solidaires",
    name: "Objets solidaires",
    description: "Pret, don et partage de petits equipements.",
    tint: "#fef3c7",
    textColor: "#a16207",
  },
];

export const DEMO_ACCOUNT = {
  email: "lea@coupdemain.local",
  password: "demo1234",
};

const seedUsers: UserSeed[] = [
  {
    id: "user-lea",
    email: DEMO_ACCOUNT.email,
    displayName: "Lea Martin",
    city: "Lille",
    password: DEMO_ACCOUNT.password,
  },
  {
    id: "user-nassim",
    email: "nassim@coupdemain.local",
    displayName: "Nassim Durand",
    city: "Roubaix",
    password: "demo1234",
  },
  {
    id: "user-clara",
    email: "clara@coupdemain.local",
    displayName: "Clara Petit",
    city: "Tourcoing",
    password: "demo1234",
  },
];

const seedPosts: PostSeed[] = [
  {
    id: randomUUID(),
    userId: "user-lea",
    slug: "aide-monter-meuble-lille",
    type: "request",
    categorySlug: "entraide-pratique",
    title: "Besoin d'aide pour monter un meuble samedi",
    description:
      "Je cherche une personne disponible une heure samedi apres-midi pour porter et monter une petite armoire dans mon appartement.",
    city: "Lille",
    contact: "lea@coupdemain.local",
    phoneNumber: "06 12 34 56 78",
    availability: "Samedi 15h - 17h",
    urgent: 1,
    tags: "meuble,quartier,1h",
    imagePath: "/illustrations/listing-entraide.svg",
    createdAt: "2026-05-08T09:30:00.000Z",
    views: 12,
  },
  {
    id: randomUUID(),
    userId: "user-nassim",
    slug: "atelier-cv-et-demarches-roubaix",
    type: "offer",
    categorySlug: "numerique-administratif",
    title: "Je propose une aide CV et demarches en ligne",
    description:
      "Je peux aider a refaire un CV, remplir un formulaire ou prendre un rendez-vous administratif en ligne.",
    city: "Roubaix",
    contact: "nassim@coupdemain.local",
    phoneNumber: "07 83 51 22 90",
    availability: "Mercredi soir",
    urgent: 0,
    tags: "cv,emploi,dossiers",
    imagePath: "/illustrations/listing-admin.svg",
    createdAt: "2026-05-07T17:10:00.000Z",
    views: 8,
  },
  {
    id: randomUUID(),
    userId: "user-clara",
    slug: "courses-et-colis-tourcoing",
    type: "request",
    categorySlug: "courses-transport",
    title: "Cherche un trajet court pour des courses et un colis",
    description:
      "Un aller-retour rapide en voiture suffirait pour recuperer un colis et quelques courses alimentaires.",
    city: "Tourcoing",
    contact: "clara@coupdemain.local",
    phoneNumber: "06 94 22 71 55",
    availability: "Vendredi avant 18h",
    urgent: 1,
    tags: "courses,colis,voiture",
    imagePath: "/illustrations/listing-transport.svg",
    createdAt: "2026-05-07T11:45:00.000Z",
    views: 15,
  },
];

function hashSeedPassword(password: string) {
  const salt = "coupdemain-local-seed";
  const hash = scryptSync(password, salt, 64).toString("hex");

  return `${salt}:${hash}`;
}

function ensureFilesystem() {
  const dataDirectory = getDatabaseDirectory();
  const uploadDirectory = getMediaDirectory("uploads");
  const avatarDirectory = getMediaDirectory("avatars");

  if (!existsSync(dataDirectory)) {
    mkdirSync(dataDirectory, { recursive: true });
  }

  if (!existsSync(uploadDirectory)) {
    mkdirSync(uploadDirectory, { recursive: true });
  }

  if (!existsSync(avatarDirectory)) {
    mkdirSync(avatarDirectory, { recursive: true });
  }
}

function getTableColumns(db: DatabaseSync, table: string) {
  return db
    .prepare(`pragma table_info(${table})`)
    .all<{ name: string }>()
    .map((column) => column.name);
}

function ensureColumn(
  db: DatabaseSync,
  table: string,
  column: string,
  definition: string,
) {
  const columns = getTableColumns(db, table);

  if (!columns.includes(column)) {
    db.exec(`alter table ${table} add column ${definition}`);
  }
}

function initializeDatabase(db: DatabaseSync) {
  db.exec(`
    pragma foreign_keys = on;

    create table if not exists users (
      id text primary key,
      email text not null unique,
      display_name text not null,
      city text not null,
      avatar_path text,
      password_hash text not null,
      created_at text not null
    );

    create table if not exists sessions (
      id text primary key,
      user_id text not null references users(id) on delete cascade,
      expires_at text not null,
      created_at text not null
    );

    create table if not exists categories (
      slug text primary key,
      name text not null,
      description text not null,
      tint text not null,
      text_color text not null
    );

    create table if not exists posts (
      id text primary key,
      user_id text not null references users(id) on delete cascade,
      slug text not null unique,
      type text not null check (type in ('request', 'offer')),
      category_slug text not null references categories(slug),
      status text not null default 'open' check (status in ('open', 'matched', 'resolved')),
      title text not null,
      description text not null,
      city text not null,
      contact text not null,
      phone_number text,
      availability text not null,
      urgent integer not null default 0,
      tags text not null default '',
      image_path text,
      views integer not null default 0,
      created_at text not null
    );

    create table if not exists saved_posts (
      user_id text not null references users(id) on delete cascade,
      post_id text not null references posts(id) on delete cascade,
      created_at text not null,
      primary key (user_id, post_id)
    );

    create table if not exists conversations (
      id text primary key,
      post_id text not null references posts(id) on delete cascade,
      owner_id text not null references users(id) on delete cascade,
      participant_id text not null references users(id) on delete cascade,
      created_at text not null,
      last_message_at text not null,
      unique (post_id, owner_id, participant_id)
    );

    create table if not exists messages (
      id text primary key,
      conversation_id text not null references conversations(id) on delete cascade,
      sender_id text not null references users(id) on delete cascade,
      content text not null,
      created_at text not null,
      read_at text
    );
  `);

  ensureColumn(db, "users", "avatar_path", "avatar_path text");
  ensureColumn(db, "posts", "phone_number", "phone_number text");
  ensureColumn(db, "posts", "views", "views integer not null default 0");

  const categoryCount =
    db.prepare("select count(*) as count from categories").get<CountRow>()?.count ?? 0;

  if (categoryCount === 0) {
    const statement = db.prepare(`
      insert into categories (slug, name, description, tint, text_color)
      values (?, ?, ?, ?, ?)
    `);

    for (const category of CATEGORY_SEEDS) {
      statement.run(
        category.slug,
        category.name,
        category.description,
        category.tint,
        category.textColor,
      );
    }
  }

  const userCount =
    db.prepare("select count(*) as count from users").get<CountRow>()?.count ?? 0;

  if (userCount === 0) {
    const statement = db.prepare(`
      insert into users (id, email, display_name, city, avatar_path, password_hash, created_at)
      values (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const user of seedUsers) {
      statement.run(
        user.id,
        user.email,
        user.displayName,
        user.city,
        user.avatarPath ?? null,
        hashSeedPassword(user.password),
        new Date("2026-05-01T09:00:00.000Z").toISOString(),
      );
    }
  }

  const postCount =
    db.prepare("select count(*) as count from posts").get<CountRow>()?.count ?? 0;

  if (postCount === 0) {
    const statement = db.prepare(`
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
      values (?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const post of seedPosts) {
      statement.run(
        post.id,
        post.userId,
        post.slug,
        post.type,
        post.categorySlug,
        post.title,
        post.description,
        post.city,
        post.contact,
        post.phoneNumber,
        post.availability,
        post.urgent,
        post.tags,
        post.imagePath,
        post.views,
        post.createdAt,
      );
    }
  }

  const postUpdateStatement = db.prepare(`
    update posts
    set phone_number = ?, views = ?
    where slug = ? and (phone_number is null or phone_number = '' or views = 0)
  `);

  for (const post of seedPosts) {
    postUpdateStatement.run(post.phoneNumber, post.views, post.slug);
  }

  db.prepare("delete from sessions where expires_at <= ?").run(
    new Date().toISOString(),
  );
}

export function getDatabase() {
  const runtime = globalThis as DatabaseGlobal;

  if (!runtime.__coupdemainDb) {
    ensureFilesystem();
    const databasePath = join(getDatabaseDirectory(), "coupdemain.sqlite");
    runtime.__coupdemainDb = new DatabaseSync(databasePath);
    initializeDatabase(runtime.__coupdemainDb);
  }

  return runtime.__coupdemainDb;
}
