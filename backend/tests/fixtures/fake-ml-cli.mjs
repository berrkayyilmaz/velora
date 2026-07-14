import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

function readArg(name) {
  const index = process.argv.indexOf(name);

  if (index === -1) {
    return null;
  }

  return process.argv[index + 1] ?? null;
}

function printModelResult(payload) {
  console.log(JSON.stringify(payload, null, 2));
}

const mode = process.env.FAKE_ML_CLI_MODE ?? "success";
const outputPath = readArg("--output");
const seed = Number(readArg("--seed") ?? "42");
const width = Number(readArg("--width") ?? "768");
const height = Number(readArg("--height") ?? "1024");

if (mode === "malformed") {
  console.log("not-json");
  process.exit(0);
}

if (outputPath === null) {
  console.error("missing --output");
  process.exit(2);
}

if (mode === "model-failure") {
  printModelResult({
    durationMs: 12.5,
    error: "normalized fake model failure",
    height,
    metadata: {
      adapterId: "catvton-research",
      adapterVersion: "test"
    },
    modelId: "catvton",
    modelVersion: "fake-test",
    outputId: path.basename(outputPath, path.extname(outputPath)),
    outputPath: null,
    seed,
    status: "failed",
    warnings: [],
    width
  });
  process.exit(1);
}

if (mode !== "missing-output") {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, "fake ml cli output\n", "utf8");
}

printModelResult({
  durationMs: 25,
  error: null,
  height,
  metadata: {
    adapterId: "catvton-research",
    adapterVersion: "test"
  },
  modelId: "catvton",
  modelVersion: "fake-test",
  outputId: path.basename(outputPath, path.extname(outputPath)),
  outputPath,
  seed,
  status: "succeeded",
  warnings: [],
  width
});
process.exit(0);
