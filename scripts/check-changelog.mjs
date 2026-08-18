import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const version = process.env.npm_new_version;

if (!version) {
  process.exit(0);
}

const changelog = readFileSync(join(root, "CHANGELOG.md"), "utf8");
const heading = `## [${version}]`;

if (!changelog.includes(heading)) {
  console.error(
    `CHANGELOG.md has no ${heading} heading. Add the release notes, then run npm version again.`,
  );
  process.exit(1);
}

const readme = readFileSync(join(root, "README.md"), "utf8");
if (!readme.includes(`**v${version}**`)) {
  console.error(
    `README.md still does not show v${version}. Update the version line before bumping.`,
  );
  process.exit(1);
}
