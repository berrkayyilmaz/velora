import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

function readArg(name) {
  const index = process.argv.indexOf(name);

  if (index === -1) {
    return null;
  }

  return process.argv[index + 1] ?? null;
}

const mode = readArg("--mode") ?? "success";
const outputPath = readArg("--output");

if (mode === "timeout") {
  await new Promise((resolve) => {
    setTimeout(resolve, 10_000);
  });
  process.exit(0);
}

if (mode === "fail") {
  console.error("fake executor failed");
  process.exit(2);
}

if (mode === "missing-output") {
  console.log("fake executor completed without output");
  process.exit(0);
}

if (outputPath === null) {
  console.error("missing --output");
  process.exit(3);
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, "fake try-on output\n", "utf8");
console.log(`fake executor wrote ${outputPath}`);
process.exit(0);
