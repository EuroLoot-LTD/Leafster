import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function openDatabase(dataDir: string) {
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, "leafster.sqlite"));
  db.exec(
    "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;",
  );
  db.exec(
    fs.readFileSync(
      fileURLToPath(new URL("../migrations/001-initial.sql", import.meta.url)),
      "utf8",
    ),
  );
  return db;
}
