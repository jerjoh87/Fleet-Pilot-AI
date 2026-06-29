"use server";

import { redirect } from "next/navigation";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function authError(message: string) {
  redirect(`/login?error=${encodeURIComponent(message)}` as never);
}

export async function signInAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/dashboard" as never);
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    authError(error.message);
  }

  if (isDatabaseConfigured()) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { memberships: { take: 1 } }
    });

    if (!user?.memberships.length) {
      redirect("/onboard" as never);
    }
  }

  redirect("/dashboard" as never);
}

export async function signUpAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/dashboard" as never);
  }

  const fullName = String(formData.get("fullName") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  });

  if (error) {
    authError(error.message);
  }

  if (isDatabaseConfigured() && data.user) {
    await prisma.user.upsert({
      where: { id: data.user.id },
      update: { email, fullName },
      create: { id: data.user.id, email, fullName }
    });
    redirect("/onboard" as never);
  }

  redirect("/dashboard" as never);
}
