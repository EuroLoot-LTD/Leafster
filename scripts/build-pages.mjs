import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
process.chdir(projectRoot);
const base = process.env.LEAFSTER_PAGES_BASE || "/Leafster/";
if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(base)) {
  throw new Error(
    "Invalid LEAFSTER_PAGES_BASE. Use /Leafster/ or another absolute pathname ending in /; path segments may contain letters, digits, underscores and hyphens.",
  );
}

// This builds only browser assets. No server, data or OAuth credentials are copied.
await build({
  mode: "pages",
  build: { outDir: "dist-pages", sourcemap: false },
});
const output = path.join(projectRoot, "dist-pages");
fs.writeFileSync(path.join(output, ".nojekyll"), "");
const html = fs.readFileSync(path.join(output, "index.html"), "utf8");
if (
  !html.includes(`href="${base}favicon.png"`) ||
  !html.includes(`${base}assets/`)
) {
  throw new Error("Pages build has incorrect project-path asset references.");
}
if (!fs.existsSync(path.join(output, "brand", "leafster-logo.png"))) {
  throw new Error("Pages logo asset is missing.");
}
for (const entry of fs.readdirSync(output, {
  recursive: true,
  withFileTypes: true,
})) {
  if (!entry.isFile()) continue;
  const name = entry.name;
  if (
    /\.(?:tsx?|sql|sqlite|db|map|mp4|webm|mov|source)$/i.test(name) ||
    name.startsWith(".env")
  ) {
    throw new Error(
      `Unexpected private/source/media artifact in Pages build: ${name}`,
    );
  }
}
console.log(
  `Static Pages build prepared in dist-pages at base ${base}. Nothing has been published. The build has no API, database, processing worker or OAuth callback.`,
);
