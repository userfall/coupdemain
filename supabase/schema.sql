create extension if not exists "pgcrypto";

create table if not exists public.users (
  id text primary key,
  email text not null unique,
  display_name text not null,
  city text not null,
  avatar_path text,
  password_hash text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sessions (
  id text primary key,
  user_id text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint sessions_user_id_fkey
    foreign key (user_id) references public.users(id) on delete cascade
);

create table if not exists public.categories (
  slug text primary key,
  name text not null,
  description text not null,
  tint text not null,
  text_color text not null
);

create table if not exists public.posts (
  id text primary key,
  user_id text not null,
  slug text not null unique,
  type text not null check (type in ('request', 'offer')),
  category_slug text not null,
  status text not null default 'open' check (status in ('open', 'matched', 'resolved')),
  title text not null,
  description text not null,
  city text not null,
  contact text not null,
  phone_number text,
  availability text not null,
  urgent boolean not null default false,
  tags text not null default '',
  image_path text,
  views integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint posts_user_id_fkey
    foreign key (user_id) references public.users(id) on delete cascade,
  constraint posts_category_slug_fkey
    foreign key (category_slug) references public.categories(slug)
);

create table if not exists public.saved_posts (
  user_id text not null,
  post_id text not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, post_id),
  constraint saved_posts_user_id_fkey
    foreign key (user_id) references public.users(id) on delete cascade,
  constraint saved_posts_post_id_fkey
    foreign key (post_id) references public.posts(id) on delete cascade
);

create table if not exists public.conversations (
  id text primary key,
  post_id text not null,
  owner_id text not null,
  participant_id text not null,
  created_at timestamptz not null default timezone('utc', now()),
  last_message_at timestamptz not null default timezone('utc', now()),
  unique (post_id, owner_id, participant_id),
  constraint conversations_post_id_fkey
    foreign key (post_id) references public.posts(id) on delete cascade,
  constraint conversations_owner_id_fkey
    foreign key (owner_id) references public.users(id) on delete cascade,
  constraint conversations_participant_id_fkey
    foreign key (participant_id) references public.users(id) on delete cascade
);

create table if not exists public.messages (
  id text primary key,
  conversation_id text not null,
  sender_id text not null,
  content text not null,
  created_at timestamptz not null default timezone('utc', now()),
  read_at timestamptz,
  constraint messages_conversation_id_fkey
    foreign key (conversation_id) references public.conversations(id) on delete cascade,
  constraint messages_sender_id_fkey
    foreign key (sender_id) references public.users(id) on delete cascade
);

alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.categories enable row level security;
alter table public.posts enable row level security;
alter table public.saved_posts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "service role only users" on public.users;
drop policy if exists "service role only sessions" on public.sessions;
drop policy if exists "service role only categories" on public.categories;
drop policy if exists "service role only posts" on public.posts;
drop policy if exists "service role only saved_posts" on public.saved_posts;
drop policy if exists "service role only conversations" on public.conversations;
drop policy if exists "service role only messages" on public.messages;

create policy "service role only users"
on public.users
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "service role only sessions"
on public.sessions
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "service role only categories"
on public.categories
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "service role only posts"
on public.posts
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "service role only saved_posts"
on public.saved_posts
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "service role only conversations"
on public.conversations
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "service role only messages"
on public.messages
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
