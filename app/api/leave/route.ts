import { NextResponse } from "next/server";
import { readLeaveCache, scanMonthLeave, writeLeaveCache, buildResponse, CACHE_TTL } from "./core";

export const maxDuration = 300;
const inFlight = new Map<string, Promise<Awaited<ReturnType<typeof scanMonthLeave>>>>();

function refresh(year: number, month: number) {
  const key = `${year}-${month}`;
  let pending = inFlight.get(key);
  if (!pending) {
    pending = scanMonthLeave(year, month).then(async data => {
      await writeLeaveCache(data, year, month);
      return data;
    }).finally(() => inFlight.delete(key));
    inFlight.set(key, pending);
  }
  return pending;
}


export async function GET(req: Request) {
  const url   = new URL(req.url);
  const force = url.searchParams.get("force") === "1";
  const aest  = new Date(Date.now() + 10 * 60 * 60 * 1000);
  // Accept an explicit year/month so leave already booked for a future month
  // is scanned for that month instead of always defaulting to today's real
  // month — previously any leave filed for a future month was silently never
  // scanned until that month became "current".
  const year  = url.searchParams.get("year")  ? Number(url.searchParams.get("year"))  : aest.getUTCFullYear();
  const month = url.searchParams.get("month") ? Number(url.searchParams.get("month")) : aest.getUTCMonth() + 1;

  const cached = await readLeaveCache(year, month);
  if (cached) {
    const fresh = Date.now() - cached.ts < CACHE_TTL;
    if (fresh && !force) {
      return NextResponse.json(await buildResponse(cached.data, year, month), { headers: { "Cache-Control": "no-store", "X-AFSS-Stale": "0", "X-AFSS-Snapshot-At": String(cached.ts) } });
    }
  }

  try {
    const leaveDays = await refresh(year, month);
    return NextResponse.json(await buildResponse(leaveDays, year, month), { headers: { "Cache-Control": "no-store", "X-AFSS-Stale": "0", "X-AFSS-Snapshot-At": String(Date.now()) } });
  } catch {
    if (cached) return NextResponse.json(await buildResponse(cached.data, year, month), { headers: { "Cache-Control": "no-store", "X-AFSS-Stale": "1", "X-AFSS-Snapshot-At": String(cached.ts) } });
    return NextResponse.json({ error: "Leave data is unavailable" }, { status: 503 });
  }
}
