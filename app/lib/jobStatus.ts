type Job = Record<string, unknown>;

export function statusKey(job: Job): "scheduled" | "awaiting" | "tentative" | "complete" {
  const stage = String(job.Stage ?? "").toLowerCase();
  const status = String((job.Status as Record<string, unknown> | undefined)?.Name ?? job.Stage ?? "").toLowerCase();

  // AE Evac's Progress stage means an audit is booked, while Progress for the
  // other companies means attendance is complete.
  if (stage === "progress" && job._company === 10) {
    return job._scheduledDate ? "scheduled" : "tentative";
  }
  if (stage === "progress" || status.includes("complete") || status.includes("released") || status.includes("attendance")) {
    return "complete";
  }
  if (status.includes("awaiting client info")) return "awaiting";
  if (job._scheduledDate) return "scheduled";
  return "tentative";
}
