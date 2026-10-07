import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Hit by Vercel Cron (see vercel.json) so the Supabase project isn't paused for inactivity.
// Writes to the DB (not just reads) so the activity definitely registers.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await prisma.keepAlive.upsert({
    where: { id: "supabase" },
    create: { id: "supabase", pings: 1 },
    update: { pings: { increment: 1 } },
  });

  return NextResponse.json({ ok: true, pings: row.pings, at: row.pingedAt });
}
