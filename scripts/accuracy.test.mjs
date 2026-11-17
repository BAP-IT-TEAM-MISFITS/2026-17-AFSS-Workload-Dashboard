import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));

function loadPureModule(relativePath, context = {}) {
  const source = readFileSync(path.join(testDirectory, '..', relativePath), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, ...context });
  return exports;
}

const { groupConsecutive, countLeaveWeekdays, remainingSupplyHours } = loadPureModule('app/lib/leaveDates.ts');
const { statusKey } = loadPureModule('app/lib/jobStatus.ts');

function dataRoute(cache, refresh) {
  return loadPureModule('app/api/data/route.ts', {
    URL,
    require: name => name === 'next/server'
      ? { NextResponse: { json: (data, options) => ({ data, ...options }) } }
      : { CACHE_TTL: 300000, readCacheRaw: async () => cache.entry, fetchAndCacheDeduped: refresh },
  });
}

test('expired job snapshot waits for SimPRO and returns the new result', async () => {
  const cache = { entry: { data: [{ ID: 1 }], ts: 1 } };
  let finish;
  const gate = new Promise(resolve => { finish = resolve; });
  const route = dataRoute(cache, async () => {
    await gate;
    cache.entry = { data: [{ ID: 2 }], ts: Date.now() };
    return cache.entry.data;
  });
  let settled = false;
  const pending = route.GET({ url: 'https://app.test/api/data' }).then(r => { settled = true; return r; });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(settled, false);
  finish();
  const response = await pending;
  assert.equal(response.data[0].ID, 2);
  assert.equal(response.headers['X-AFSS-Stale'], '0');
});

test('failed job refresh preserves snapshot and marks it stale', async () => {
  const cache = { entry: { data: [{ ID: 1 }], ts: 1 } };
  const route = dataRoute(cache, async () => { throw new Error('upstream unavailable'); });
  const response = await route.GET({ url: 'https://app.test/api/data?force=1' });
  assert.equal(response.data[0].ID, 1);
  assert.equal(response.headers['X-AFSS-Stale'], '1');
  assert.equal(response.headers['X-AFSS-Snapshot-At'], '1');
});

test('valid zero-job response replaces a previous nonempty snapshot', async () => {
  let written;
  const simpro = loadPureModule('app/lib/simpro.ts', {
    process: { env: {} },
    fetch: async () => ({ ok: true, status: 200, json: async () => [] }),
    require: name => {
      if (name === 'fs') return { promises: { writeFile: async (_file, json) => { written = JSON.parse(json); } } };
      if (name === 'path') return { join: (...parts) => parts.join('/') };
      if (name === 'os') return { default: { tmpdir: () => '/tmp' } };
      return { gcsWrite: async () => true, gcsRead: async () => JSON.stringify({ data: [{ ID: 1 }], ts: 1 }) };
    },
  });
  await simpro.fetchAndCache(1, 'Pending');
  assert.equal(written.data.length, 0);
  assert.equal(written.partial, false);
});

test('forced leave refresh returns refreshed bookings instead of the old cache', async () => {
  const route = loadPureModule('app/api/leave/route.ts', {
    URL,
    require: name => name === 'next/server'
      ? { NextResponse: { json: (data, options) => ({ data, ...options }) } }
      : {
        CACHE_TTL: 300000,
        readLeaveCache: async () => ({ data: { marker: 'old' }, ts: Date.now() }),
        scanMonthLeave: async () => ({ marker: 'new' }),
        writeLeaveCache: async () => {},
        buildResponse: async data => data,
      },
  });
  const response = await route.GET({ url: 'https://app.test/api/leave?force=1' });
  assert.equal(response.data.marker, 'new');
  assert.equal(response.headers['X-AFSS-Stale'], '0');
});

test('separate booked weekdays do not consume the day between them', () => {
  const ranges = groupConsecutive(['2026-11-02', '2026-11-04']);
  assert.equal(ranges.length, 2);
  assert.equal(countLeaveWeekdays(ranges, '2026-11-01', '2026-11-30'), 2);
});

test('weekend bridges a continuous Friday to Monday booking', () => {
  const ranges = groupConsecutive(['2026-11-06', '2026-11-09']);
  assert.equal(ranges.length, 1);
  assert.equal(countLeaveWeekdays(ranges, '2026-11-01', '2026-11-30'), 2);
});

test('leave deducts only remaining weekdays that are not already holidays', () => {
  const ranges = groupConsecutive(['2026-11-09', '2026-11-10', '2026-11-11']);
  const holidays = new Set(['2026-11-11']);
  assert.equal(countLeaveWeekdays(ranges, '2026-11-10', '2026-11-30', holidays), 1);
  assert.equal(remainingSupplyHours(80, ranges, '2026-11-10', '2026-11-30', holidays), 72);
});

test('awaiting client information stays in its own dashboard row', () => {
  assert.equal(statusKey({ Stage: 'Pending', Status: { Name: 'Awaiting Client Info' }, _company: 1 }), 'awaiting');
  assert.equal(statusKey({ Stage: 'Pending', Status: { Name: 'Awaiting Client Info' }, _scheduledDate: '2026-11-10' }), 'awaiting');
  assert.equal(statusKey({ Stage: 'Progress', _company: 10, _scheduledDate: '2026-11-10' }), 'scheduled');
});

test('daily schedules include every page before reporting a complete result', async () => {
  const pages = [];
  const { fetchScheduleDay } = loadPureModule('app/lib/simproSchedules.ts', {
    process: { env: { SIMPRO_BASE_URL: 'https://simpro.example', SIMPRO_TOKEN: 'test-token' } },
    URLSearchParams,
    fetch: async url => {
      const page = Number(new URL(url).searchParams.get('page'));
      pages.push(page);
      return { status: 200, ok: true, json: async () => page === 1 ? Array.from({ length: 250 }, (_, ID) => ({ ID })) : [{ ID: 251 }] };
    },
  });
  const rows = await fetchScheduleDay(1, '2026-11-10');
  assert.equal(rows.length, 251);
  assert.equal(pages.join(','), '1,2');
});

test('a failed later schedule page rejects the entire scan', async () => {
  const { fetchScheduleDay } = loadPureModule('app/lib/simproSchedules.ts', {
    process: { env: { SIMPRO_BASE_URL: 'https://simpro.example', SIMPRO_TOKEN: 'test-token' } },
    URLSearchParams,
    setTimeout: callback => callback(),
    fetch: async url => {
      const page = Number(new URL(url).searchParams.get('page'));
      return page === 1
        ? { status: 200, ok: true, json: async () => Array.from({ length: 250 }, (_, ID) => ({ ID })) }
        : { status: 503, ok: false };
    },
  });
  await assert.rejects(fetchScheduleDay(1, '2026-11-10'), /Incomplete SimPRO schedule scan/);
});
