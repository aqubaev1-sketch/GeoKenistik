"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function redirectWithMessage(path: string, message: string): never {
  redirect(`${path}?message=${encodeURIComponent(message)}`);
}

export async function signUp(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!fullName || !email || password.length < 8) {
    redirectWithMessage("/register", "Барлық өрісті толтырыңыз. Құпиясөз кемінде 8 таңбадан тұрсын.");
  }
  if (role !== "student" && role !== "teacher") {
    redirectWithMessage("/register", "Пайдаланушы рөлін таңдаңыз.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
        status: role === "teacher" ? "pending" : "active",
      },
    },
  });

  if (error) {
    const message = error.message.toLowerCase().includes("already registered")
      ? "Бұл электрондық пошта бұрын тіркелген. Кіру беті арқылы кіріңіз."
      : error.message.toLowerCase().includes("email rate limit exceeded")
        ? "Хат жіберу лимиті аяқталды. Біраз уақыттан кейін қайталап көріңіз немесе жүйеге кіріңіз."
        : "Тіркелу орындалмады. Деректерді тексеріп, қайталап көріңіз.";
    redirectWithMessage("/register", message);
  }

  const message = role === "teacher"
    ? "Тіркелу аяқталды. Электрондық поштаңызды растаңыз. Мұғалім аккаунтын әкімші тексереді."
    : "Тіркелу аяқталды. Электрондық поштаңызды растаңыз.";
  redirectWithMessage("/login", message);
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirectWithMessage("/login", "Электрондық пошта немесе құпиясөз қате.");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    redirectWithMessage("/login", "Профиль табылмады. Әкімшіге хабарласыңыз.");
  }

  if (profile.status === "blocked" || profile.status === "rejected") {
    await supabase.auth.signOut();
    redirectWithMessage("/login", "Аккаунтқа кіруге рұқсат берілмеген.");
  }

  if (profile.role === "teacher" && profile.status !== "active") {
    await supabase.auth.signOut();
    redirectWithMessage("/login", "Мұғалім аккаунты әкімшінің растауын күтуде.");
  }

  redirect("/dashboard");
}
