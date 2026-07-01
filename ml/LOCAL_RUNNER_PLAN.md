# Velora AI Local Runner Plan

Version: 1.0  
Status: Planning Only  
Last Updated: 2026-07-01

## 1. Purpose

The local runner will provide a reproducible command-line boundary for
evaluating self-hosted virtual try-on providers outside the Velora application.

The runner will eventually:

- Load one approved provider adapter.
- Validate one versioned benchmark configuration.
- Resolve ignored local inputs.
- Verify model and checkpoint identities.
- Check the requested compute device.
- Execute smoke, quality, or stress cases.
- Normalize provider results.
- Write structured metrics and review artifacts.
- Clean temporary data after every case.

The runner will not be a public service, backend route, mobile dependency, or
production worker.

This document does not implement runner code, install packages, or download
models.

## 2. Design Principles

- One explicit provider and version per run.
- No automatic model, checkpoint, device, seed, or resolution substitution.
- No automatic artifact downloads during a benchmark run.
- Configuration is validated before model loading.
- Inputs remain read-only.
- Outputs are immutable and isolated by run ID.
- Console and structured logs contain no image data or personal identifiers.
- Every result includes complete pipeline identity.
- Failures remain part of benchmark evidence.
- Temporary files are removed after success, failure, timeout, or cancellation.
- Model weights and generated outputs never enter Git.

## 3. Planned Runner Structure

The following is a future structure proposal. This task does not create these
files or directories.

```text
ml/
|-- runner/
|   |-- cli/                 Command parsing and exit behavior
|   |-- config/              Config loading, validation, and resolution
|   |-- contracts/           Common input, output, and result contracts
|   |-- providers/           Provider adapter boundary
|   |   |-- catvton/
|   |   |-- idm_vton/
|   |   `-- stable_viton/
|   |-- preprocessing/       Registered masks and image normalization
|   |-- execution/           Case orchestration, timeouts, and cleanup
|   |-- metrics/             Runtime and quality metric collection
|   |-- registry/            Model and pipeline registry access
|   |-- storage/             Local input/output path abstraction
|   |-- safety/              Input and output safety gates
|   `-- logging/             Console and structured event logging
|-- configs/
|   |-- templates/           Reviewable committed examples
|   `-- local/               Machine-specific ignored configs
|-- data/
|   |-- input/               Ignored benchmark inputs
|   `-- output/              Ignored run outputs
|-- models/                  Ignored repositories and weights
|-- notebooks/               Optional review notebooks
`-- scripts/                 Small future operator commands
```

### 3.1 Responsibility Boundaries

`cli`:

- Accept provider, config, split, case, and device selections.
- Print safe progress and final status.
- Map terminal failures to stable process exit codes.

`config`:

- Parse and validate configuration.
- Reject unknown fields.
- Resolve inheritance before execution.
- Produce one immutable effective configuration.

`providers`:

- Implement the common provider interface.
- Hide upstream repository arguments and file layouts.
- Normalize provider-specific failures.

`execution`:

- Run cases in deterministic order.
- Apply timeout and cleanup policy.
- Never contain model-specific preprocessing.

`metrics`:

- Capture stage timing and resources.
- Write measurements without interpreting them as quality.

`storage`:

- Resolve approved local assets.
- Prevent path traversal.
- Keep all writes inside the selected run directory.

## 4. Configuration Strategy

### 4.1 Format

Use one human-readable format, preferably YAML, for operator-authored run
configuration. Validate it against a strict typed schema before use.

JSON may be used for generated effective configuration and result artifacts.
Do not support multiple editable config formats in the first runner.

### 4.2 Configuration Layers

Planned layers:

1. Committed non-sensitive template
2. Provider preset
3. Local machine configuration
4. Run-specific command-line overrides from a small allowlist

Later layers may override only approved fields. Provider identity, checkpoint
hash, dataset version, and safety policy must not be changed by unrestricted
command-line strings.

### 4.3 Required Configuration

```text
schemaVersion
run:
  name
  split
  caseIds
provider:
  providerId
  providerVersion
  modelRevision
  checkpointId
  checkpointHash
pipeline:
  pipelineVersion
  preprocessingPreset
  inferencePreset
device:
  type
  index
  precision
  allowTf32
limits:
  caseTimeoutSeconds
  maxRetries
paths:
  datasetRoot
  modelRoot
  outputRoot
  temporaryRoot
```

### 4.4 Config Safety

Config files must not contain:

- Access tokens
- Passwords
- Signed URLs
- Private image bytes
- User IDs, names, or emails
- Arbitrary shell commands
- Unvalidated Python import paths
- Unpinned model URLs

Machine-specific config belongs under a future ignored `ml/configs/local`
directory. Committed templates must use placeholders and relative paths.

### 4.5 Effective Config

Before model loading, the runner should:

1. Parse all layers.
2. Reject unknown or conflicting fields.
3. Resolve paths to canonical absolute paths.
4. Verify allowed path roots.
5. Verify registry identity and artifact hashes.
6. Write an immutable `effective-config.json` to the run directory.

The effective config, not the original template, defines the run.

## 5. Input Paths

### 5.1 Dataset Root

Default logical path:

```text
ml/data/input/benchmarks/<dataset-id>/
```

The runner should receive a dataset ID and version, then resolve assets through
the dataset manifest. Operators should not pass arbitrary person or garment
paths for benchmark runs.

### 5.2 Model Root

Default logical path:

```text
ml/models/<provider-id>/<model-revision>/
```

Model code, checkpoints, and caches remain ignored. The runner must verify that:

- The model revision matches the registry.
- Every checkpoint hash matches.
- No required artifact is missing.
- No extra automatic download is needed.

### 5.3 Temporary Root

Use a task-scoped ignored directory:

```text
ml/data/output/.tmp/<run-id>/<case-id>/
```

Temporary contents may include normalized images, masks, pose data, and
provider-native input structures.

The runner must remove the case directory after each terminal outcome.
Debug preservation requires an explicit approved flag and a short retention
deadline.

### 5.4 Path Rules

- Resolve symlinks and canonical paths before access.
- Reject traversal outside approved dataset, model, output, and temporary roots.
- Open benchmark inputs read-only.
- Do not write into model repositories or dataset directories.
- Do not follow output symlinks to external locations.
- Use generated IDs rather than source file names in output paths.

## 6. Output Paths

Each run writes to:

```text
ml/data/output/benchmarks/<run-id>/
|-- effective-config.json
|-- run-manifest.json
|-- events.jsonl
|-- cases/
|   `-- <case-id>/
|       |-- result.json
|       |-- generated/
|       `-- review.json
|-- metrics/
|   |-- cases.jsonl
|   `-- summary.json
|-- reviews/
|   `-- review-summary.csv
`-- logs/
    `-- runner.log
```

Rules:

- A run directory is created once and never reused.
- Existing run files are not overwritten.
- Generated image files use framework IDs, not person or garment source names.
- Partial results remain marked incomplete.
- No result path may escape the run directory.
- Output cleanup follows the benchmark dataset retention policy.

## 7. Logging

### 7.1 Console Log

The console should show:

- Run ID
- Provider and pipeline identity
- Device selection
- Current case ID
- Current stage
- Safe warning or failure code
- Aggregate completion count
- Final output directory

It must not show:

- Image bytes
- Private absolute source paths
- Original filenames containing personal data
- Checkpoint download credentials
- Signed URLs
- Raw prompts
- Full upstream exceptions by default

### 7.2 Structured Events

Use newline-delimited JSON for machine-readable events.

Common fields:

| Field | Purpose |
| --- | --- |
| `timestamp` | UTC event time. |
| `level` | `debug`, `info`, `warning`, or `error`. |
| `runId` | Current run. |
| `caseId` | Current case when applicable. |
| `providerId` | Selected provider. |
| `providerVersion` | Exact adapter version. |
| `stage` | Validation, preprocessing, load, inference, output, or cleanup. |
| `eventType` | Stable event identifier. |
| `durationMs` | Optional stage duration. |
| `failureCode` | Optional normalized failure. |
| `attempt` | Attempt number. |

### 7.3 Diagnostic Logs

Detailed upstream exceptions may be retained locally only when:

- Debug logging is explicitly enabled.
- Paths and credentials are redacted.
- Logs remain in the ignored run directory.
- A retention deadline is assigned.

Diagnostics must not contain tensor dumps or image data.

## 8. Benchmark Result Format

### 8.1 Run Manifest

`run-manifest.json` should include:

- Run and dataset identity
- Provider and full pipeline identity
- Host, Python, dependency-lock, driver, GPU, and CUDA identity
- Start and completion timestamps
- Requested and completed splits
- Case counts by status
- Effective config hash
- Result format version
- Retention and deletion status

### 8.2 Case Result

Each `result.json` should follow the common provider output contract and add:

| Field | Purpose |
| --- | --- |
| `caseId` | Benchmark case identity. |
| `inputHashes` | Person, garment, mask, and pose hashes. |
| `attempts` | Ordered attempt records. |
| `selectedProvider` | Actual provider and version. |
| `fallbackUsed` | Whether an approved fallback occurred. |
| `outputHashes` | Generated result identities. |
| `metrics` | Timing and resource measurements. |
| `reviewStatus` | Pending, completed, or rejected. |
| `cleanupStatus` | Temporary-file cleanup result. |

### 8.3 Summary

`summary.json` should contain:

- Success, rejection, failure, timeout, and OOM rates
- Cold and warm timings kept separate
- Stage timing distributions
- Peak VRAM and RAM
- Output validity rate
- Quality review aggregates
- Safety rejection counts
- Failure counts by stable code
- Missing metric counts

Do not calculate an overall score that hides safety failures or unavailable
measurements.

### 8.4 Human Review

Review artifacts should reference case and output hashes. They may contain
rubric scores and reviewer IDs that are internal aliases, but no personal input
details.

Generated images remain separate binary assets and must not be embedded in JSON,
CSV, or notebook files.

## 9. GPU Checks

Before model loading, the runner should verify:

- `nvidia-smi` succeeds when NVIDIA GPU execution is requested.
- Requested GPU index exists.
- GPU name and total VRAM match the recorded machine profile.
- Available VRAM exceeds the provider's configured minimum.
- PyTorch detects the expected CUDA runtime.
- `torch.cuda.is_available()` is true.
- A small tensor operation completes on the selected GPU.
- Precision requirements are supported.
- No conflicting benchmark worker owns the same GPU.

The selected device identity belongs in the run manifest.

If any required GPU check fails, the runner must stop before processing private
inputs or loading large checkpoints.

## 10. CPU Checks

CPU mode must be explicit:

```text
device.type: cpu
```

Allowed CPU runner modes:

- Config validation
- Dataset manifest validation
- Hash verification
- Image preprocessing tests
- Provider import checks
- Explicitly supported small smoke tests

CPU mode must reject quality, stress, latency, VRAM, and production-capacity
benchmarks.

The runner must never silently change `cuda` to `cpu`.

## 11. Failure Handling

### 11.1 Failure Stages

Normalize failures by stage:

- Configuration
- Registry and license
- Dataset and input validation
- Artifact verification
- Device checks
- Model loading
- Preprocessing
- Inference
- Output validation
- Safety validation
- Result writing
- Cleanup

### 11.2 Stable Failure Codes

Use the common framework codes:

- `invalid_input`
- `unsupported_category`
- `missing_preprocessor`
- `preprocessing_failed`
- `model_load_failed`
- `checkpoint_unavailable`
- `out_of_memory`
- `inference_failed`
- `output_invalid`
- `safety_rejected`
- `timed_out`
- `provider_unavailable`
- `license_blocked`

Runner-specific codes may include:

- `invalid_config`
- `path_not_allowed`
- `artifact_hash_mismatch`
- `device_unavailable`
- `result_write_failed`
- `cleanup_failed`

### 11.3 Retry Rules

The initial local runner should default to zero retries.

A future retry may be allowed only for an explicitly classified transient
failure. Every retry must:

- Preserve the original case.
- Preserve provider, checkpoint, seed, resolution, and precision.
- Increment the attempt number.
- Record the prior failure.
- Use a new task-scoped temporary directory.

Do not retry safety, consent, ownership, invalid-input, unsupported-category,
license, or hash failures.

### 11.4 Timeouts And Cancellation

- Apply separate preprocessing and inference timeouts.
- Mark timed-out cases explicitly.
- Attempt graceful provider cancellation.
- Terminate orphan child processes when safe.
- Run cleanup regardless of cancellation outcome.
- Never report a timed-out partial image as successful.

### 11.5 OOM Handling

On GPU out-of-memory:

- Record the provider, stage, resolution, precision, and memory observations.
- Release task references and clear recoverable GPU cache.
- Verify worker health before another case.
- Do not silently lower resolution, precision, steps, or batch size.
- Stop the run when the configured OOM threshold is reached.

### 11.6 Cleanup Failure

Cleanup failure does not change an inference result to success. It creates a
separate `cleanup_failed` condition and should stop the run when private
temporary media may remain.

## 12. Process Exit Status

Planned process outcomes:

| Exit class | Meaning |
| --- | --- |
| Success | All requested cases reached expected terminal outcomes. |
| Partial | Run completed but one or more cases failed unexpectedly. |
| Configuration failure | Run did not start due to config, registry, or path errors. |
| Environment failure | Device, dependency, or artifact verification failed. |
| Safety failure | A safety control failed or could not run. |
| Cleanup failure | Private temporary data could not be confirmed deleted. |

Exact numeric exit codes should be defined only when the CLI is implemented.

## 13. No-Commit Rules

Never commit:

- Model repositories copied under `ml/models`
- Model weights
- Checkpoints
- Downloaded datasets
- Person, garment, mask, or pose assets
- Generated images
- Benchmark outputs
- Run logs
- Local effective configs containing machine paths
- Python environments
- Package caches
- Notebook checkpoints or notebooks with embedded private outputs
- Credentials or access tokens

Before committing runner source in the future:

1. Run `git status --ignored`.
2. Confirm only source, schemas, templates, and documentation are tracked.
3. Confirm no binary model or image files are staged.
4. Clear notebook outputs.
5. Search staged text for private paths, URLs, tokens, and identifiers.

Git ignore rules reduce accidental commits but do not replace access control,
consent, retention, or secure deletion.

## 14. Initial Runner Milestones

### Milestone 1: Validation-Only Runner

- Parse config
- Resolve registry entry
- Validate dataset manifest
- Verify paths and hashes
- Check device
- Write effective config
- Run no model

### Milestone 2: Single-Case Smoke Runner

- One provider
- One synthetic case
- No fallback
- Batch size one
- Structured result and cleanup

### Milestone 3: Benchmark Runner

- Versioned split execution
- Timing and resource metrics
- Resume through explicit new run identity
- Human-review artifacts

### Milestone 4: Internal Worker Compatibility

- Reuse common contracts and provider adapters
- Replace local paths with private storage references
- Keep benchmark and production policies separate

These milestones require separate implementation approval.

## 15. Related Documents

- [AI Provider Benchmark Framework](./AI_PROVIDER_FRAMEWORK.md)
- [Benchmark Dataset Plan](./BENCHMARK_DATASET_PLAN.md)
- [CatVTON Research Notes](./CATVTON_RESEARCH.md)
- [Python Environment Plan](./PYTHON_ENV.md)
- [AI Lab Setup](../docs/AI_LAB_SETUP.md)

