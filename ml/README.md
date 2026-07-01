# Velora AI Workspace

## Purpose

The `ml/` workspace is an isolated Python project for local AI provider,
dataset, benchmark, and reporting experiments. It is not imported by the
Velora backend, frontend, or admin applications.

The current workspace provides typed contracts and deterministic dummy
execution only. It does not contain model inference, AI libraries, model
weights, preprocessing pipelines, or automatic downloads.

## Setup

Run commands from the `ml/` directory:

```powershell
uv sync --group dev
```

This creates the ignored `ml/.venv` environment using the Python version in
`.python-version`. Runtime code has no third-party dependencies. The
development group contains Ruff, Black, and MyPy.

## CLI Commands

### Environment Check

Print non-sensitive Python and platform information:

```powershell
uv run python -m src.main
```

Show all available commands:

```powershell
uv run python -m src.main --help
```

### Dummy Provider Run

Run the deterministic dummy provider using the default runner config:

```powershell
uv run python -m src.main dummy --request-id dummy-smoke
```

This reads `config/example.runner.json` by default. It does not read image
files or execute inference.

### Config-Backed Dummy Run

Provide a runner config explicitly:

```powershell
uv run python -m src.main dummy `
  --config config/example.runner.json `
  --request-id config-smoke
```

Supported CLI overrides include provider, device, input/output directories,
model path, batch size, image dimensions, seed, and mock asset references:

```powershell
uv run python -m src.main dummy `
  --config config/example.runner.json `
  --request-id override-smoke `
  --output-dir data/output/manual `
  --width 512 `
  --height 768 `
  --seed 7
```

### Manifest Validation

Validate the benchmark dataset manifest structure without requiring referenced
image files:

```powershell
uv run python -m src.main validate-manifest `
  --manifest config/example.dataset.json
```

The loader validates manifest identity, unique sample IDs, safe relative image
paths, optional mask paths, categories, and sample types.

### Dummy Batch Benchmark

Run the dummy provider once for every sample in a validated manifest:

```powershell
uv run python -m src.main dummy-batch `
  --config config/example.runner.json `
  --manifest config/example.dataset.json `
  --run-id dummy-batch-smoke
```

Omit `--run-id` to generate a filesystem-safe run ID automatically.

### Markdown Report Generation

Generate a report from a batch summary and its sibling `results/` directory:

```powershell
uv run python -m src.main report `
  --summary data/output/benchmarks/dummy-batch-smoke/summary.json `
  --output data/output/benchmarks/dummy-batch-smoke/report.md
```

The report includes run totals, average duration, failed samples, and output
artifact paths.

## Output Locations

The default runner config uses:

```text
data/output/benchmarks/
```

A single dummy run writes:

```text
<outputDir>/
|-- <request-id>-<hash>.benchmark-result.json
`-- <request-id>-<hash>.dummy-output.json
```

A batch run writes:

```text
<outputDir>/<runId>/
|-- summary.json
|-- report.md                         Generated only by the report command
`-- results/
    |-- <sample-id>-<hash>.benchmark-result.json
    `-- <sample-id>-<hash>.dummy-output.json
```

The dummy output artifact is deterministic JSON. It is not a generated image.
The report command writes only to the path supplied through `--output`.

## Ignored Artifacts

The repository ignore rules exclude:

- `ml/.venv`
- Model weights and common checkpoint formats
- Model repositories and checkpoint directories
- Downloaded datasets and benchmark inputs
- Generated benchmark outputs and reports
- Python, tool, model, and notebook caches
- Local logs and temporary artifacts

Tracked `.gitkeep` files preserve required empty directories. Never force-add
ignored model files, datasets, generated outputs, private images, credentials,
or machine-specific caches.

Git ignore rules are not privacy or access controls. Operators remain
responsible for asset rights, consent, access restrictions, retention, and
secure deletion.

## No-Model Boundary

Current commands are limited to:

- Environment inspection
- Typed provider and runner configuration validation
- Dataset manifest validation
- Deterministic dummy provider execution
- Benchmark result and summary generation
- Markdown report generation

They do not:

- Install or import AI model libraries
- Download repositories, checkpoints, weights, or datasets
- Decode or process person or garment images
- Run virtual try-on or any other inference
- Connect to Velora backend, frontend, admin, databases, or production APIs
- Use real user media

Real model adapters require separate approval after license, privacy, hardware,
dataset, and safety requirements are verified.

## Related Documents

- [AI Lab Setup](../docs/AI_LAB_SETUP.md)
- [Virtual Try-On Architecture](../docs/VIRTUAL_TRY_ON_ARCHITECTURE.md)
- [AI Provider Framework](./AI_PROVIDER_FRAMEWORK.md)
- [Benchmark Dataset Plan](./BENCHMARK_DATASET_PLAN.md)
- [Local Runner Plan](./LOCAL_RUNNER_PLAN.md)
