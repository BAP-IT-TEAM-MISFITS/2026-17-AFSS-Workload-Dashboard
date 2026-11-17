export type DateRange = { from: string; to: string };

// Keep separate bookings separate. Only weekends may bridge two booked weekdays.
export function groupConsecutive(dates: string[]): DateRange[] {
  const sorted = [...new Set(dates)].sort();
  if (sorted.length === 0) return [];

  const ranges: DateRange[] = [];
  let start = sorted[0];
  let previous = sorted[0];
  for (const current of sorted.slice(1)) {
    const day = new Date(`${previous}T12:00:00Z`);
    let next = previous;
    do {
      day.setUTCDate(day.getUTCDate() + 1);
      next = day.toISOString().slice(0, 10);
    } while (next < current && (day.getUTCDay() === 0 || day.getUTCDay() === 6));

    if (next === current) {
      previous = current;
    } else {
      ranges.push({ from: start, to: previous });
      start = previous = current;
    }
  }
  ranges.push({ from: start, to: previous });
  return ranges;
}

export function countLeaveWeekdays(
  ranges: DateRange[],
  from: string,
  to: string,
  holidays: Set<string> = new Set(),
): number {
  const days = new Set<string>();
  for (const range of ranges) {
    const start = range.from > from ? range.from : from;
    const end = range.to < to ? range.to : to;
    if (start > end) continue;
    const day = new Date(`${start}T12:00:00Z`);
    while (day.toISOString().slice(0, 10) <= end) {
      const date = day.toISOString().slice(0, 10);
      if (day.getUTCDay() !== 0 && day.getUTCDay() !== 6 && !holidays.has(date)) days.add(date);
      day.setUTCDate(day.getUTCDate() + 1);
    }
  }
  return days.size;
}

export function remainingSupplyHours(
  baseHours: number,
  ranges: DateRange[],
  from: string,
  to: string,
  holidays: Set<string>,
): number {
  return Math.max(0, baseHours - countLeaveWeekdays(ranges, from, to, holidays) * 8);
}
