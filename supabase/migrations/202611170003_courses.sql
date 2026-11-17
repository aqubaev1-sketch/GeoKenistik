-- Courses, topics, lessons, and group assignments.

do $$ begin
  create type public.content_status as enum ('draft', 'published');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  grade smallint not null default 10 check (grade = 10),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  summary text not null default '' check (char_length(summary) <= 1000),
  content text not null default '',
  youtube_url text check (youtube_url is null or youtube_url ~ '^https://(www\.)?(youtube\.com|youtu\.be)/'),
  status public.content_status not null default 'draft',
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_groups (
  course_id uuid not null references public.courses(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (course_id, group_id)
);

alter table public.courses enable row level security;
alter table public.topics enable row level security;
alter table public.lessons enable row level security;
alter table public.course_groups enable row level security;

create or replace function public.teacher_owns_course(target_course_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.courses where id = target_course_id and teacher_id = auth.uid());
$$;

create or replace function public.teacher_owns_topic(target_topic_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.topics t join public.courses c on c.id = t.course_id
    where t.id = target_topic_id and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.student_has_course(target_course_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.course_groups cg
    join public.group_members gm on gm.group_id = cg.group_id
    join public.courses c on c.id = cg.course_id
    where cg.course_id = target_course_id
      and gm.student_id = auth.uid()
      and c.status = 'published'
  );
$$;

revoke all on function public.teacher_owns_course(uuid) from public;
revoke all on function public.teacher_owns_topic(uuid) from public;
revoke all on function public.student_has_course(uuid) from public;
grant execute on function public.teacher_owns_course(uuid) to authenticated;
grant execute on function public.teacher_owns_topic(uuid) to authenticated;
grant execute on function public.student_has_course(uuid) to authenticated;

drop policy if exists "Teachers manage own courses" on public.courses;
create policy "Teachers manage own courses" on public.courses for all to authenticated
using (teacher_id = auth.uid() or public.is_admin())
with check (teacher_id = auth.uid() and public.is_active_teacher());

drop policy if exists "Students read assigned courses" on public.courses;
create policy "Students read assigned courses" on public.courses for select to authenticated
using (public.student_has_course(id));

drop policy if exists "Teachers manage own topics" on public.topics;
create policy "Teachers manage own topics" on public.topics for all to authenticated
using (public.teacher_owns_course(course_id) or public.is_admin())
with check (public.teacher_owns_course(course_id));

drop policy if exists "Students read assigned topics" on public.topics;
create policy "Students read assigned topics" on public.topics for select to authenticated
using (public.student_has_course(course_id));

drop policy if exists "Teachers manage own lessons" on public.lessons;
create policy "Teachers manage own lessons" on public.lessons for all to authenticated
using (public.teacher_owns_topic(topic_id) or public.is_admin())
with check (public.teacher_owns_topic(topic_id));

drop policy if exists "Students read published lessons" on public.lessons;
create policy "Students read published lessons" on public.lessons for select to authenticated
using (
  status = 'published'
  and exists (
    select 1 from public.topics t
    where t.id = topic_id and public.student_has_course(t.course_id)
  )
);

drop policy if exists "Teachers assign own courses" on public.course_groups;
create policy "Teachers assign own courses" on public.course_groups for all to authenticated
using (public.teacher_owns_course(course_id) and public.teacher_owns_group(group_id))
with check (public.teacher_owns_course(course_id) and public.teacher_owns_group(group_id));

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at before update on public.courses
for each row execute procedure public.set_updated_at();

drop trigger if exists lessons_set_updated_at on public.lessons;
create trigger lessons_set_updated_at before update on public.lessons
for each row execute procedure public.set_updated_at();

grant select, insert, update, delete on public.courses to authenticated;
grant select, insert, update, delete on public.topics to authenticated;
grant select, insert, update, delete on public.lessons to authenticated;
grant select, insert, delete on public.course_groups to authenticated;
