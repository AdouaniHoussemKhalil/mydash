// Lance Vitest avec une lettre de lecteur en majuscule sous Windows.
// Un cwd « c:\... » (terminal VS Code) fait charger Vitest deux fois et
// toutes les suites échouent avec « failed to find the current suite ».
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const upperDrive = (path) => path.replace(/^[a-z]:/, (drive) => drive.toUpperCase());

const cwd = upperDrive(process.cwd());
const bin = upperDrive(
  createRequire(import.meta.url)
    .resolve("vitest/package.json")
    .replace(/package\.json$/, "vitest.mjs"),
);

const { status } = spawnSync(process.execPath, [bin, ...process.argv.slice(2)], {
  cwd,
  stdio: "inherit",
});
process.exit(status ?? 1);
