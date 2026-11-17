import { NextResponse } from "next/server";
import {
  fetchAndCacheDeduped,
  readCacheRaw,
  CACHE_TTL,
} from "../../lib/simpro";

export const maxDuration = 300;

function snapshotResponse(data: Record<string, unknown>[], ts: number, stale: boolean) {
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store",
      "X-AFSS-Snapshot-At": String(ts),
      "X-AFSS-Stale": stale ? "1" : "0",
    },
  });
}

export async function GET(req: Request) {
  try {
    const url     = new URL(req.url);
    const company = Number(url.searchParams.get("company") ?? "1");
    const stage   = url.searchParams.get("stage") ?? "Pending";
    const force   = url.searchParams.get("force") === "1";

    const entry = await readCacheRaw(company, stage);
    if (entry && !entry.partial) {
      const fresh = Date.now() - entry.ts < CACHE_TTL;

      if (!force && fresh) {
        return snapshotResponse(entry.data, entry.ts, false);
      }

      try {
          const data = await fetchAndCacheDeduped(company, stage);
          const updated = await readCacheRaw(company, stage);
          return snapshotResponse(data, updated?.ts ?? entry.ts, !updated || updated.ts === entry.ts);
      } catch {
        return snapshotResponse(entry.data, entry.ts, true);
      }

    }

    // Cold cache — fetch directly, no gate blocking.
    const data = await fetchAndCacheDeduped(company, stage);
    const updated = await readCacheRaw(company, stage);
    return snapshotResponse(data, updated?.ts ?? Date.now(), !updated);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
