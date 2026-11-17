-- Lesson tasks, protected solutions, and student submissions.

do $$ begin
  create type public.task_type as enum ('single_choice', 'short_text', 'long_text');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.check_mode as enum ('automatic', 'manual');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.submission_status as enum ('submitted', 'graded', 'returned');
exception when duplicate_object then null;
end $$;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  prompt text not null check (char_length(prompt) between 2 and 5000),
  type public.task_type not null,
  options jsonb not null default '[]'::jsonb,
  points numeric(6,2) not null default 1 check (points > 0),
  check_mode public.check_mode not null,
  status public.content_status not null default 'draft',
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.task_solutions (
  task_id uuid primary key references public.tasks(id) on delete cascade,
  correct_answer text not null,
  explanation text not null default ''
);

create table if not exists public.task_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  answer text not null,
  status public.submission_status not null default 'submitted',
  score numeric(6,2) check (score is null or score >= 0),
  feedback text not null default '',
  submitted_at timestamptz not null default now(),
  graded_at timestamptz,
  unique (task_id, student_id)
);

alter table public.tasks enable row level security;
alter table public.task_solutions enable row level security;
alter table public.task_submissions enable row level security;

create or replace function public.teacher_owns_lesson(target_lesson_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.lessons l
    join public.topics t on t.id = l.topic_id
    join public.courses c on c.id = t.course_id
    where l.id = target_lesson_id and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.teacher_owns_task(target_task_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.tasks t
    where t.id = target_task_id and public.teacher_owns_lesson(t.lesson_id)
  );
$$;

create or replace function public.student_has_lesson(target_lesson_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.lessons l
    join public.topics t on t.id = l.topic_id
    where l.id = target_lesson_id
      and l.status = 'published'
      and public.student_has_course(t.course_id)
  );
$$;

revoke all on function public.teacher_owns_lesson(uuid) from public;
revoke all on function public.teacher_owns_task(uuid) from public;
revoke all on function public.student_has_lesson(uuid) from public;
grant execute on function public.teacher_owns_lesson(uuid) to authenticated;
grant execute on function public.teacher_owns_task(uuid) to authenticated;
grant execute on function public.student_has_lesson(uuid) to authenticated;

drop policy if exists "Teachers manage lesson tasks" on public.tasks;
create policy "Teachers manage lesson tasks" on public.tasks for all to authenticated
using (public.teacher_owns_lesson(lesson_id) or public.is_admin())
with check (public.teacher_owns_lesson(lesson_id));

drop policy if exists "Students read published tasks" on public.tasks;
create policy "Students read published tasks" on public.tasks for select to authenticated
using (status = 'published' and public.student_has_lesson(lesson_id));

drop policy if exists "Teachers manage task solutions" on public.task_solutions;
create policy "Teachers manage task solutions" on public.task_solutions for all to authenticated
using (public.teacher_owns_task(task_id) or public.is_admin())
with check (public.teacher_owns_task(task_id));

drop policy if exists "Students read own submissions" on public.task_submissions;
create policy "Students read own submissions" on public.task_submissions for select to authenticated
using (student_id = auth.uid());

drop policy if exists "Teachers read task submissions" on public.task_submissions;
create policy "Teachers read task submissions" on public.task_submissions for select to authenticated
using (public.teacher_owns_task(task_id) or public.is_admin());

drop policy if exists "Teachers grade task submissions" on public.task_submissions;
create policy "Teachers grade task submissions" on public.task_submissions for update to authenticated
using (public.teacher_owns_task(task_id))
with check (public.teacher_owns_task(task_id));

create or replace function public.submit_task_answer(target_task_id uuid, submitted_answer text)
returns public.task_submissions
language plpgsql security definer set search_path = ''
as $$
declare
  current_task public.tasks;
  solution public.task_solutions;
  result public.task_submissions;
  calculated_score numeric(6,2);
  calculated_status public.submission_status;
begin
  select * into current_task from public.tasks where id = target_task_id;
  if current_task.id is null or current_task.status <> 'published' or not public.student_has_lesson(current_task.lesson_id) then
    raise exception 'Task is unavailable';
  end if;
  if nullif(trim(submitted_answer), '') is null then raise exception 'Answer is required'; end if;

  if current_task.check_mode = 'automatic' then
    select * into solution from public.task_solutions where task_id = target_task_id;
    calculated_score := case when lower(trim(submitted_answer)) = lower(trim(solution.correct_answer)) then current_task.points else 0 end;
    calculated_status := 'graded';
  else
    calculated_score := null;
    calculated_status := 'submitted';
  end if;

  insert into public.task_submissions (task_id, student_id, answer, status, score, submitted_at, graded_at)
  values (target_task_id, auth.uid(), trim(submitted_answer), calculated_status, calculated_score, now(), case when calculated_status = 'graded' then now() else null end)
  on conflict (task_id, student_id) do update set
    answer = excluded.answer,
    status = excluded.status,
    score = excluded.score,
    feedback = '',
    submitted_at = now(),
    graded_at = excluded.graded_at
  returning * into result;
  return result;
end;
$$;

revoke all on function public.submit_task_answer(uuid, text) from public;
grant execute on function public.submit_task_answer(uuid, text) to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.task_solutions to authenticated;
grant select, update on public.task_submissions to authenticated;
