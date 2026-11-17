import { promises as fs } from "fs";
import { gcsWrite } from "./gcsCache";

// Manual edits must not report success unless the durable copy was saved.
export async function persistJson(file: string, key: string, json: string): Promise<void> {
  if (process.env.GCS_BUCKET) {
    if (!await gcsWrite(key, json)) throw new Error("Cloud storage save failed");
    // The container's copy is only a fallback; GCS is the source of truth.
    await fs.writeFile(file, json, "utf-8").catch(() => {});
    return;
  }
  if (process.env.NODE_ENV === "production") throw new Error("Cloud storage is not configured");
  await fs.writeFile(file, json, "utf-8");
}
