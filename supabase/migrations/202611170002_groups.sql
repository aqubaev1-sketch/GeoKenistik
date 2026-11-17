-- Teacher groups and student membership.

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  grade smallint not null default 10 check (grade = 10),
  academic_year text not null check (academic_year ~ '^20[0-9]{2}–20[0-9]{2}$'),
  invite_code text not null unique check (invite_code ~ '^[A-Z0-9]{6}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, student_id)
);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

create or replace function public.is_active_teacher()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher' and status = 'active'
  );
$$;

create or replace function public.teacher_owns_group(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.groups
    where id = target_group_id and teacher_id = auth.uid()
  );
$$;

create or replace function public.can_read_group(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.teacher_owns_group(target_group_id)
    or exists (
      select 1 from public.group_members
      where group_id = target_group_id and student_id = auth.uid()
    )
    or public.is_admin();
$$;

create or replace function public.can_read_profile(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_user_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1
      from public.group_members gm
      join public.groups g on g.id = gm.group_id
      where gm.student_id = target_user_id
        and g.teacher_id = auth.uid()
    );
$$;

revoke all on function public.is_active_teacher() from public;
revoke all on function public.teacher_owns_group(uuid) from public;
revoke all on function public.can_read_group(uuid) from public;
revoke all on function public.can_read_profile(uuid) from public;
grant execute on function public.is_active_teacher() to authenticated;
grant execute on function public.teacher_owns_group(uuid) to authenticated;
grant execute on function public.can_read_group(uuid) to authenticated;
grant execute on function public.can_read_profile(uuid) to authenticated;

drop policy if exists "Teachers create own groups" on public.groups;
create policy "Teachers create own groups" on public.groups
  for insert to authenticated
  with check (teacher_id = auth.uid() and public.is_active_teacher());

drop policy if exists "Members read groups" on public.groups;
create policy "Members read groups" on public.groups
  for select to authenticated
  using (public.can_read_group(id));

drop policy if exists "Teachers update own groups" on public.groups;
create policy "Teachers update own groups" on public.groups
  for update to authenticated
  using (public.teacher_owns_group(id))
  with check (teacher_id = auth.uid());

drop policy if exists "Teachers delete own groups" on public.groups;
create policy "Teachers delete own groups" on public.groups
  for delete to authenticated
  using (public.teacher_owns_group(id));

drop policy if exists "Members read memberships" on public.group_members;
create policy "Members read memberships" on public.group_members
  for select to authenticated
  using (student_id = auth.uid() or public.teacher_owns_group(group_id) or public.is_admin());

drop policy if exists "Teachers remove members" on public.group_members;
create policy "Teachers remove members" on public.group_members
  for delete to authenticated
  using (public.teacher_owns_group(group_id) or public.is_admin());

drop policy if exists "Teachers read their students" on public.profiles;
create policy "Teachers read their students" on public.profiles
  for select to authenticated
  using (public.can_read_profile(id));

create or replace function public.join_group_by_code(code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_group_id uuid;
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'student' and status = 'active'
  ) then
    raise exception 'Only active students can join groups';
  end if;

  select id into target_group_id
  from public.groups
  where invite_code = upper(trim(code));

  if target_group_id is null then
    raise exception 'Group not found';
  end if;

  insert into public.group_members (group_id, student_id)
  values (target_group_id, auth.uid())
  on conflict do nothing;

  return target_group_id;
end;
$$;

revoke all on function public.join_group_by_code(text) from public;
grant execute on function public.join_group_by_code(text) to authenticated;

grant select, insert, update, delete on public.groups to authenticated;
grant select, delete on public.group_members to authenticated;
