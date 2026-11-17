"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"]);

export function UploadForm({ lessonId, userId }: { lessonId: string; userId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function upload(formData: FormData) {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return;
    if (!allowedTypes.has(file.type) || file.size > 20 * 1024 * 1024) {
      setMessage("PDF немесе сурет таңдаңыз. Файл көлемі 20 МБ-тан аспауы керек.");
      return;
    }

    setUploading(true);
    setMessage("");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
    const path = `${userId}/${lessonId}/${crypto.randomUUID()}-${safeName}`;
    const supabase = createClient();

    const { data: record, error: recordError } = await supabase.from("lesson_files").insert({
      lesson_id: lessonId,
      uploader_id: userId,
      storage_path: path,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    }).select("id").single();

    if (recordError || !record) {
      setMessage("Файл туралы ақпаратты сақтау мүмкін болмады.");
      setUploading(false);
      return;
    }

    const { error: uploadError } = await supabase.storage.from("lesson-files").upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      await supabase.from("lesson_files").delete().eq("id", record.id);
      setMessage("Файлды жүктеу мүмкін болмады.");
      setUploading(false);
      return;
    }

    setMessage("Файл жүктелді.");
    setUploading(false);
    router.refresh();
  }

  return (
    <form action={upload} className="mt-5 space-y-4">
      <label className="block text-sm font-semibold">PDF немесе сурет<input name="file" type="file" required accept="application/pdf,image/jpeg,image/png,image/webp,image/gif" className="mt-2 block w-full rounded-xl border border-slate-300 bg-white p-3 text-sm file:me-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-700" /></label>
      <button disabled={uploading} className="min-h-11 w-full rounded-xl bg-blue-700 px-4 font-semibold text-white hover:bg-blue-800 disabled:cursor-wait disabled:bg-slate-400">{uploading ? "Жүктелуде…" : "Файл жүктеу"}</button>
      {message && <p role="status" className="text-sm leading-6 text-slate-700">{message}</p>}
    </form>
  );
}
