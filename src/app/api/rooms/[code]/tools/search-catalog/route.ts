import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/serverClient";
import { requireParticipant } from "@/lib/session-server";

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const auth = await requireParticipant(req, params.code);
  if ("reason" in auth) {
    return NextResponse.json({ ok: false, reason: auth.reason }, { status: 401 });
  }

  const { query, category } = (await req.json()) as { query?: string; category?: string };
  const supabase = getServerClient();
  let builder = supabase.from("catalog_items").select("*");
  if (category) builder = builder.eq("category", category);
  if (query && query.trim()) {
    builder = builder.or(`name.ilike.%${query.trim()}%,tags.cs.{${query.trim()}}`);
  }

  const { data: items, error } = await builder.limit(20);
  if (error) {
    return NextResponse.json({ ok: false, reason: "search_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, items });
}
