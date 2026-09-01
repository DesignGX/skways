import type { Database } from "@/types/database";
import { createClient } from "@/lib/supabase/server";

export async function testQuery() {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, full_name");
  // eslint-disable-next-line no-console
  console.log(data);
  const t: Database["public"]["Tables"]["profiles"]["Row"]["full_name"] = "x";
  // eslint-disable-next-line no-console
  console.log(t);
}
