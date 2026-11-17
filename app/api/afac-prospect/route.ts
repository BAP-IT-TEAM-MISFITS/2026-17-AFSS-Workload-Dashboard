import { NextResponse } from "next/server";
import { buildData, buildDebugData, readCachedEntry, writeCachedEntry, CACHE_TTL } from "./core";

export type { AfacProspectResponse } from "./core";

// The cumulative window grows every month, so a cold computation (no cache
// at all yet for that month) can take well over a minute — give it real
// headroom instead of the platform default, same as the other heavy routes.
export const maxDuration = 300;

async function recompute(filterYear?: number, filterMonth?: number, force = false) {
  const data = await buildData(filterYear, filterMonth, force);
  await writeCachedEntry(data, filterYear, filterMonth);
  return data;
}

export async function GET(req: Request) {
  const url   = new URL(req.url);
  const force = url.searchParams.get("force") === "1";

  if (url.searchParams.get("debug") === "1") {
    const yearParam  = url.searchParams.get("year");
    const monthParam = url.searchParams.get("month");
    const data = await buildDebugData(yearParam ? parseInt(yearParam, 10) : undefined, monthParam ? parseInt(monthParam, 10) : undefined);
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  }

  const yearParam   = url.searchParams.get("year");
  const monthParam  = url.searchParams.get("month");
  const filterYear  = yearParam  ? parseInt(yearParam,  10) : undefined;
  const filterMonth = monthParam ? parseInt(monthParam, 10) : undefined;

  const entry = await readCachedEntry(filterYear, filterMonth);

  if (entry && !force && Date.now() - entry.ts < CACHE_TTL) {
    const fresh = Date.now() - entry.ts < CACHE_TTL;
    return NextResponse.json(entry.data, { headers: { "Cache-Control": "no-store", "X-AFSS-Stale": fresh ? "0" : "1" } });
  }

  try {
    const data = await recompute(filterYear, filterMonth, force);
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store", "X-AFSS-Stale": "0" } });
  } catch (err) {
    if (entry) return NextResponse.json(entry.data, { headers: { "Cache-Control": "no-store", "X-AFSS-Stale": "1" } });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
