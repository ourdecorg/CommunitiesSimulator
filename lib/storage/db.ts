/**
 * Tiny synchronous JSON file store.
 * Each collection is a flat array written to data/<name>.json.
 * Not suitable for high concurrency, but fine for a local dev tool.
 */
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function filePath(collection: string): string {
  return path.join(DATA_DIR, `${collection}.json`);
}

export function readCollection<T>(collection: string): T[] {
  ensureDataDir();
  const fp = filePath(collection);
  if (!fs.existsSync(fp)) return [];
  try {
    return JSON.parse(fs.readFileSync(fp, "utf-8")) as T[];
  } catch {
    return [];
  }
}

export function writeCollection<T>(collection: string, data: T[]): void {
  ensureDataDir();
  fs.writeFileSync(filePath(collection), JSON.stringify(data, null, 2), "utf-8");
}
