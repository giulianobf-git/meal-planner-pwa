-- ============================================================
-- Meal Planner PWA — Supabase Migration
-- ============================================================
-- NOTE: Since this uses PIN-based auth (not Supabase Auth),
-- RLS is disabled. Access control is enforced at the app level,
-- filtering by user_id in all queries. This is a private 2-user app.
-- ============================================================

-- 1. USER PROFILES (PIN-based auth for G and L)
create table if not exists user_profiles (
  user_id      text primary key,
  display_name text not null,
  pin          text not null,
  created_at   timestamptz default now()
);

-- Seed users
insert into user_profiles (user_id, display_name, pin)
values
  ('g', 'G', '2610'),
  ('l', 'L', '0803')
on conflict (user_id) do nothing;

-- 2. INGREDIENTS (Global dictionary per user)
create table if not exists ingredients (
  id         uuid default gen_random_uuid() primary key,
  user_id    text not null,
  name       text not null,
  category   text not null default 'Other',
  created_at timestamptz default now()
);

-- 3. RECIPES
create table if not exists recipes (
  id           uuid default gen_random_uuid() primary key,
  user_id      text not null,
  name         text not null,
  instructions text default '',
  created_at   timestamptz default now()
);

-- 4. RECIPE_INGREDIENTS (many-to-many)
create table if not exists recipe_ingredients (
  id            uuid default gen_random_uuid() primary key,
  recipe_id     uuid not null references recipes(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  quantity      text not null default ''
);

-- 5. MEAL PLAN
create table if not exists meal_plan (
  id          uuid default gen_random_uuid() primary key,
  user_id     text not null,
  recipe_id   uuid not null references recipes(id) on delete cascade,
  target_date date not null,
  slot_type   text not null check (slot_type in ('lunch', 'dinner')),
  created_at  timestamptz default now(),
  unique (user_id, target_date, slot_type)
);

-- Indexes for performance
create index if not exists idx_ingredients_user on ingredients(user_id);
create index if not exists idx_recipes_user on recipes(user_id);
create index if not exists idx_meal_plan_user_date on meal_plan(user_id, target_date);
create index if not exists idx_recipe_ingredients_recipe on recipe_ingredients(recipe_id);

-- 6. GROCERY EXTRAS (manual items added per week)
create table if not exists grocery_extras (
  id            uuid default gen_random_uuid() primary key,
  user_id       text not null,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  week_start    date not null,
  created_at    timestamptz default now()
);

alter table grocery_extras disable row level security;
create index if not exists idx_grocery_extras_user_week on grocery_extras(user_id, week_start);
