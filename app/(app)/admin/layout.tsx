import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** `/admin/*`: admins only (`app_role = 'admin'`, PRD §11). Others get a 404, not a hint. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/masuk?next=/admin");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) notFound();
  return children;
}
