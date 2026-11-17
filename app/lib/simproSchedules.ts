const PAGE_SIZE = 250;
const MAX_PAGES = 20;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchScheduleDay(company: number, date: string, expandCostCenter = false): Promise<Record<string, unknown>[]> {
  const base = process.env.SIMPRO_BASE_URL;
  const token = process.env.SIMPRO_TOKEN?.replace(/^﻿/, "").trim();
  if (!base || !token) throw new Error("SimPRO is not configured");

  const all: Record<string, unknown>[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const query = new URLSearchParams({ pageSize: String(PAGE_SIZE), page: String(page), Date: date });
    if (expandCostCenter) query.set("expand", "CostCenter");
    const url = `${base}/api/v1.0/companies/${company}/schedules/?${query}`;
    let items: Record<string, unknown>[] | null = null;

    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          cache: "no-store",
        });
        if (response.status === 429 || response.status >= 500) {
          if (attempt < 3) await sleep(1000 * Math.pow(2, attempt));
          continue;
        }
        if (!response.ok) throw new Error(`SimPRO ${response.status}: ${url}`);
        const body = await response.json();
        const result = Array.isArray(body) ? body : body?.Result;
        if (!Array.isArray(result)) throw new Error(`Unexpected SimPRO schedule response: ${url}`);
        items = result as Record<string, unknown>[];
        break;
      } catch (error) {
        if (attempt === 3) throw error;
        await sleep(500 * (attempt + 1));
      }
    }

    if (!items) throw new Error(`Incomplete SimPRO schedule scan: ${url}`);
    all.push(...items);
    if (items.length < PAGE_SIZE) return all;
  }
  throw new Error(`SimPRO schedule scan exceeded ${MAX_PAGES} pages for ${company}/${date}`);
}
