import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { join } from "path";
import os from "os";
import { gcsRead } from "../../lib/gcsCache";
import { groupConsecutive } from "../../lib/leaveDates";
import { fetchScheduleDay } from "../../lib/simproSchedules";
import { persistJson } from "../../lib/persistJson";
import { getMonthPublicHolidays, remainingWorkingDays } from "../leave/core";

const LEAVE_REFS  = new Set(["1", "2"]); // Annual Leave, Sick/Personal Leave
const MEMBERS_FILE = join(process.cwd(), "data", "extra-team-members.json");
const MEMBERS_GCS_KEY = "data-extra-team-members.json";
const CACHE_DIR = process.env.CACHE_DIR ?? os.tmpdir();
const CACHE_TTL   = 60 * 60_000;

function cacheFile(year: number, month: number) {
  return join(CACHE_DIR, `afss-extra-team-leave-${year}-${String(month).padStart(2, "0")}.json`);
}

export type ExtraMember = { id: number; name: string; role: string; company: number };
type LeaveCache = { data: Record<number, string[]>; ts: number };

// ── persistence ──────────────────────────────────────────────────────────────

async function readMembers(): Promise<ExtraMember[]> {
  // GCS is the source of truth — a stale copy of MEMBERS_FILE is baked into
  // every container image, so it must never shadow saved edits.
  try {
    const remote = await gcsRead(MEMBERS_GCS_KEY);
    if (remote) {
      const data = JSON.parse(remote) as ExtraMember[];
      fs.writeFile(MEMBERS_FILE, remote, "utf-8").catch(() => {});
      return data;
    }
  } catch {}
  // Fall back to local file (dev without GCS_BUCKET, or GCS outage)
  try {
    return JSON.parse(await fs.readFile(MEMBERS_FILE, "utf-8")) as ExtraMember[];
  } catch {}
  return [];
}

async function writeMembers(members: ExtraMember[]): Promise<void> {
  await fs.mkdir(join(process.cwd(), "data"), { recursive: true });
  const json = JSON.stringify(members, null, 2);
  await persistJson(MEMBERS_FILE, MEMBERS_GCS_KEY, json);
}

async function readLeaveCache(year: number, month: number): Promise<LeaveCache | null> {
  try {
    return JSON.parse(await fs.readFile(cacheFile(year, month), "utf-8")) as LeaveCache;
  } catch { return null; }
}

async function writeLeaveCache(data: Record<number, string[]>, year: number, month: number): Promise<void> {
  await fs.writeFile(cacheFile(year, month), JSON.stringify({ data, ts: Date.now() }), "utf-8");
}

async function invalidateLeaveCaches(): Promise<void> {
  const files = await fs.readdir(CACHE_DIR).catch(() => []);
  await Promise.all(files.filter(file => file.startsWith("afss-extra-team-leave-") && file.endsWith(".json"))
    .map(file => fs.unlink(join(CACHE_DIR, file)).catch(() => {})));
}

// ── SimPRO helpers ────────────────────────────────────────────────────────────

async function fetchDayBlocks(company: number, date: string): Promise<Record<string, unknown>[]> {
  return fetchScheduleDay(company, date);
}

async function scanLeave(
  members: ExtraMember[],
  year: number,
  month: number,
): Promise<Record<number, string[]>> {
  const leaveDays: Record<number, string[]> = {};
  for (const m of members) leaveDays[m.id] = [];

  if (members.length === 0) return leaveDays;

  // Build list of weekdays to scan
  const daysInMonth = new Date(year, month, 0).getDate();
  const days: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      days.push(`${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
  }

  // Group members by company so we fetch the right schedule endpoint
  const byCompany = new Map<number, Set<number>>();
  for (const m of members) {
    if (!byCompany.has(m.company)) byCompany.set(m.company, new Set());
    byCompany.get(m.company)!.add(m.id);
  }

  for (const [company, ids] of byCompany) {
    const results: Record<string, unknown>[][] = [];
    for (let i = 0; i < days.length; i += 4) {
      results.push(...await Promise.all(days.slice(i, i + 4).map(d => fetchDayBlocks(company, d))));
    }
    for (let j = 0; j < days.length; j++) {
      for (const block of results[j]) {
        const staffId = (block.Staff as Record<string, unknown>)?.ID as number;
        const ref     = String(block.Reference ?? "");
        if (ids.has(staffId) && block.Type === "activity" && LEAVE_REFS.has(ref)) {
          leaveDays[staffId].push(days[j]);
        }
      }
    }
  }

  return leaveDays;
}

async function buildResponse(
  members: ExtraMember[],
  leaveDays: Record<number, string[]>,
  year: number,
  month: number,
) {
  const publicHolidays = await getMonthPublicHolidays(year, month);
  const supplyHours = remainingWorkingDays(year, month, new Set(publicHolidays.map(holiday => holiday.date))) * 8;
  return members.map(m => ({
    ...m,
    monthlyHours: supplyHours,
    leave: groupConsecutive(leaveDays[m.id] ?? []),
  }));
}

// ── route handlers ────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const members = await readMembers();
  const aest    = new Date(Date.now() + 10 * 60 * 60 * 1000);
  const url     = new URL(req.url);
  const year    = Number(url.searchParams.get("year") ?? aest.getUTCFullYear());
  const month   = Number(url.searchParams.get("month") ?? aest.getUTCMonth() + 1);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid year or month" }, { status: 400 });
  }

  const cached = await readLeaveCache(year, month);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(await buildResponse(members, cached.data, year, month));
  }

  const leaveDays = await scanLeave(members, year, month);
  await writeLeaveCache(leaveDays, year, month);
  return NextResponse.json(await buildResponse(members, leaveDays, year, month));
}

export async function POST(req: Request) {
  const body = await req.json() as { id: number; name: string; role: string; company: number };
  if (!body.id || !body.name) {
    return NextResponse.json({ error: "id and name are required" }, { status: 400 });
  }
  const members = await readMembers();
  if (members.some(m => m.id === body.id)) {
    return NextResponse.json({ error: "Member already added" }, { status: 409 });
  }
  members.push({ id: body.id, name: body.name, role: body.role || "", company: body.company });
  await writeMembers(members);

  // Invalidate leave cache so next GET rescans with the new member
  await invalidateLeaveCaches();

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const body = await req.json() as { id: number };
  const members = await readMembers();
  const filtered = members.filter(m => m.id !== body.id);
  await writeMembers(filtered);
  await invalidateLeaveCaches();
  return NextResponse.json({ ok: true });
}
