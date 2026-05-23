create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  city text not null,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  type text not null check (type in ('request', 'offer')),
  status text not null default 'open' check (status in ('open', 'matched', 'resolved')),
  title text not null,
  description text not null,
  city text not null,
  contact text not null,
  availability text,
  urgent boolean not null default false,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.posts enable row level security;

create policy "profiles are readable by everyone"
on public.profiles
for select
using (true);

create policy "users manage their own profile"
on public.profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "categories are readable by everyone"
on public.categories
for select
using (true);

create policy "posts are readable by everyone"
on public.posts
for select
using (true);

create policy "authenticated users can create posts"
on public.posts
for insert
to authenticated
with check (auth.uid() = author_id);

create policy "authors can update their posts"
on public.posts
for update
to authenticated
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

create policy "authors can delete their posts"
on public.posts
for delete
to authenticated
using (auth.uid() = author_id);
