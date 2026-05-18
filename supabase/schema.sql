-- ============================================================
-- Project Intelligence SaaS — Supabase Schema
-- Safe to re-run (uses IF NOT EXISTS throughout)
-- ============================================================

create extension if not exists pg_trgm;

-- ── Tables ──────────────────────────────────────────────────
create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  created_by  uuid not null references auth.users on delete cascade,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists project_members (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  user_id    uuid not null references auth.users on delete cascade,
  role       text not null check (role in ('admin', 'editor', 'viewer')) default 'viewer',
  created_at timestamptz default now(),
  unique (project_id, user_id)
);

create table if not exists documents (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects on delete cascade,
  name        text not null,
  file_path   text not null,
  file_type   text not null,
  size_bytes  bigint not null default 0,
  status      text not null check (status in ('uploading', 'processing', 'ready', 'error')) default 'processing',
  uploaded_by uuid references auth.users,
  created_at  timestamptz default now()
);

create table if not exists document_chunks (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references documents on delete cascade,
  project_id    uuid not null references projects on delete cascade,
  content       text not null,
  chunk_index   int  not null,
  created_at    timestamptz default now()
);

create index if not exists document_chunks_fts on document_chunks
  using gin (to_tsvector('english', content));

create table if not exists chat_sessions (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  user_id    uuid not null references auth.users on delete cascade,
  title      text,
  created_at timestamptz default now()
);

create table if not exists chat_messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions on delete cascade,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,
  sources    jsonb,
  created_at timestamptz default now()
);

-- ── updated_at trigger ──────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists projects_updated_at on projects;
create trigger projects_updated_at before update on projects
  for each row execute function update_updated_at();

-- ── Row Level Security ──────────────────────────────────────
alter table projects        enable row level security;
alter table project_members enable row level security;
alter table documents       enable row level security;
alter table document_chunks enable row level security;
alter table chat_sessions   enable row level security;
alter table chat_messages   enable row level security;

-- Helper function
create or replace function is_project_member(pid uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from project_members
    where project_id = pid and user_id = auth.uid()
  );
$$;

-- ── Drop existing policies before recreating ────────────────
do $$ begin
  drop policy if exists "members read projects"    on projects;
  drop policy if exists "creator insert projects"  on projects;
  drop policy if exists "admin update projects"    on projects;
  drop policy if exists "members read members"     on project_members;
  drop policy if exists "members insert own membership" on project_members;
  drop policy if exists "admin manage members"     on project_members;
  drop policy if exists "members read documents"   on documents;
  drop policy if exists "members insert documents" on documents;
  drop policy if exists "members delete documents" on documents;
  drop policy if exists "members update documents" on documents;
  drop policy if exists "members read chunks"      on document_chunks;
  drop policy if exists "members write chunks"     on document_chunks;
  drop policy if exists "members delete chunks"    on document_chunks;
  drop policy if exists "owner read sessions"      on chat_sessions;
  drop policy if exists "owner insert sessions"    on chat_sessions;
  drop policy if exists "owner read messages"      on chat_messages;
  drop policy if exists "owner write messages"     on chat_messages;
end $$;

-- projects
create policy "members read projects" on projects for select
  using (is_project_member(id));
create policy "creator insert projects" on projects for insert
  with check (auth.uid() = created_by);
create policy "admin update projects" on projects for update
  using (exists (
    select 1 from project_members
    where project_id = id and user_id = auth.uid() and role = 'admin'
  ));

-- project_members
create policy "members read members" on project_members for select
  using (is_project_member(project_id));
create policy "members insert own membership" on project_members for insert
  with check (auth.uid() = user_id);
create policy "admin manage members" on project_members for delete
  using (exists (
    select 1 from project_members pm2
    where pm2.project_id = project_id and pm2.user_id = auth.uid() and pm2.role = 'admin'
  ));

-- documents
create policy "members read documents" on documents for select
  using (is_project_member(project_id));
create policy "members insert documents" on documents for insert
  with check (is_project_member(project_id));
create policy "members delete documents" on documents for delete
  using (is_project_member(project_id));
create policy "members update documents" on documents for update
  using (is_project_member(project_id));

-- document_chunks
create policy "members read chunks" on document_chunks for select
  using (is_project_member(project_id));
create policy "members write chunks" on document_chunks for insert
  with check (is_project_member(project_id));
create policy "members delete chunks" on document_chunks for delete
  using (is_project_member(project_id));

-- chat_sessions
create policy "owner read sessions" on chat_sessions for select
  using (auth.uid() = user_id);
create policy "owner insert sessions" on chat_sessions for insert
  with check (auth.uid() = user_id);

-- chat_messages
create policy "owner read messages" on chat_messages for select
  using (exists (
    select 1 from chat_sessions where id = session_id and user_id = auth.uid()
  ));
create policy "owner write messages" on chat_messages for insert
  with check (exists (
    select 1 from chat_sessions where id = session_id and user_id = auth.uid()
  ));

-- ── Storage bucket ──────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('documents', 'documents', false)
  on conflict do nothing;

drop policy if exists "members upload documents" on storage.objects;
drop policy if exists "members read documents"   on storage.objects;
drop policy if exists "members delete documents" on storage.objects;

create policy "members upload documents" on storage.objects for insert
  with check (bucket_id = 'documents' and auth.uid() is not null);
create policy "members read documents" on storage.objects for select
  using (bucket_id = 'documents' and auth.uid() is not null);
create policy "members delete documents" on storage.objects for delete
  using (bucket_id = 'documents' and auth.uid() is not null);
