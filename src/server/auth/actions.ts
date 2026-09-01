"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { registerSchema, loginSchema, forgotPasswordSchema } from "@/lib/validations";
import { homePathForRole } from "@/lib/auth/roles";
import { getCurrentSessionUser } from "@/lib/auth/session";

export async function login(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid details." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    return { ok: false, error: "Invalid email or password." };
  }

  const session = await getCurrentSessionUser();
  revalidatePath("/", "layout");
  redirect(homePathForRole(session?.role ?? null));
}

export async function register(formData: FormData): Promise<{ ok: boolean; error?: string; checkEmail?: boolean }> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid details." };
  }

  const origin = (await headers()).get("origin") ?? "";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        role: "CUSTOMER",
        full_name: parsed.data.fullName,
        company_name: parsed.data.companyName ?? "",
        phone: parsed.data.phone ?? "",
      },
      emailRedirectTo: `${origin}/login`,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { ok: false, error: "An account with this email already exists. Please sign in." };
    }
    return { ok: false, error: "Registration failed. Please try again." };
  }

  // If email confirmation is enabled, no session is returned yet.
  if (!data.session) {
    return { ok: false, checkEmail: true };
  }

  revalidatePath("/", "layout");
  redirect("/customer/dashboard");
}

export async function forgotPassword(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid email." };
  }

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/reset-password`,
  });
  if (error) {
    return { ok: false, error: "We could not send a reset link. Please try again." };
  }
  return { ok: true };
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}