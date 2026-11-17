-- Private lesson material storage for images and PDF files.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lesson-files',
  'lesson-files',
  false,
  20971520,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.lesson_files (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  uploader_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 255),
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 20971520),
  created_at timestamptz not null default now()
);

alter table public.lesson_files enable row level security;

create or replace function public.can_access_lesson_file(object_name text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.lesson_files f
    where f.storage_path = object_name
      and (
        public.teacher_owns_lesson(f.lesson_id)
        or public.student_has_lesson(f.lesson_id)
        or public.is_admin()
      )
  );
$$;

revoke all on function public.can_access_lesson_file(text) from public;
grant execute on function public.can_access_lesson_file(text) to authenticated;

drop policy if exists "Teachers manage lesson file records" on public.lesson_files;
create policy "Teachers manage lesson file records" on public.lesson_files for all to authenticated
using (public.teacher_owns_lesson(lesson_id) or public.is_admin())
with check (uploader_id = auth.uid() and public.teacher_owns_lesson(lesson_id));

drop policy if exists "Students read lesson file records" on public.lesson_files;
create policy "Students read lesson file records" on public.lesson_files for select to authenticated
using (public.student_has_lesson(lesson_id));

drop policy if exists "Teachers upload lesson files" on storage.objects;
create policy "Teachers upload lesson files" on storage.objects for insert to authenticated
with check (
  bucket_id = 'lesson-files'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_active_teacher()
);

drop policy if exists "Authorized users read lesson files" on storage.objects;
create policy "Authorized users read lesson files" on storage.objects for select to authenticated
using (bucket_id = 'lesson-files' and public.can_access_lesson_file(name));

drop policy if exists "Teachers delete lesson files" on storage.objects;
create policy "Teachers delete lesson files" on storage.objects for delete to authenticated
using (
  bucket_id = 'lesson-files'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.can_access_lesson_file(name)
);

grant select, insert, delete on public.lesson_files to authenticated;
