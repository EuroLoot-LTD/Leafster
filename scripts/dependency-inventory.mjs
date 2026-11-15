import fs from "node:fs";
import path from "node:path";
const packages = [];
function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.name.startsWith("@")) {
      scan(absolute);
      continue;
    }
    const file = path.join(absolute, "package.json");
    if (!fs.existsSync(file)) continue;
    const p = JSON.parse(fs.readFileSync(file));
    packages.push({
      name: p.name,
      version: p.version,
      license: p.license || "REVIEW REQUIRED",
      repository:
        typeof p.repository === "string" ? p.repository : p.repository?.url,
    });
    const nested = path.join(absolute, "node_modules");
    if (fs.existsSync(nested)) scan(nested);
  }
}
scan("node_modules");
packages.sort(
  (a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version),
);
fs.writeFileSync(
  "THIRD-PARTY-NOTICES.json",
  JSON.stringify(
    {
      generated: "2026-11-15",
      note: "Installed dependency declarations; not legal clearance. Preserve original package licence texts on distribution.",
      packages,
    },
    null,
    2,
  ) + "\n",
);
console.log(`Recorded ${packages.length} dependency declarations.`);
