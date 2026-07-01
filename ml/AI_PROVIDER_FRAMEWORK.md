# Velora AI Provider Benchmark Framework

Version: 1.0  
Status: Planning Only  
Last Updated: 2026-07-01

## 1. Purpose

This document defines a model-neutral framework for evaluating and eventually
operating multiple self-hosted virtual try-on providers.

Initial research candidates include:

- CatVTON
- IDM-VTON
- StableVITON
- Additional reviewed open-source models

The framework prevents Velora application contracts from depending directly on
one research repository, preprocessing pipeline, checkpoint format, or
inference command.

This document does not implement adapters, inference, model downloads, or
runtime integration.

## 2. Design Principles

- Keep provider code outside the Fastify, Expo, and admin runtimes.
- Expose one stable internal task contract to provider adapters.
- Keep provider-specific preprocessing behind the adapter boundary.
- Pin every source revision, checkpoint, preprocessor, and runtime image.
- Never infer capabilities from a model name alone.
- Record every benchmark failure, fallback, and output revision.
- Treat licensing, privacy, safety, and artifact access as eligibility gates.
- Do not silently fall back to CPU, another model, or lower quality.
- Keep source media and generated results out of Git.
- Prefer reproducibility over provider-specific convenience.

## 3. Framework Boundary

```text
Benchmark Runner or Future AI Worker
                |
                v
        Provider Orchestrator
                |
       Common Input Contract
                |
     +----------+-----------+
     |          |           |
     v          v           v
 CatVTON     IDM-VTON   StableVITON
 Adapter      Adapter       Adapter
     |          |           |
     +----------+-----------+
                |
       Common Output Contract
                |
                v
   Metrics, Review, and Registry
```

The provider abstraction is an internal ML boundary. It is not a public API and
must not expose upstream repository arguments directly to mobile clients.

## 4. Common Input Contract

### 4.1 TryOnInput

| Field | Required | Purpose |
| --- | --- | --- |
| `requestId` | Yes | Unique experiment or job identifier. |
| `personAsset` | Yes | Approved local person-image reference. |
| `garmentAsset` | Yes | Approved local garment-image reference. |
| `garmentCategory` | Yes | Normalized category such as `upper_body`. |
| `maskAsset` | No | Reviewed or generated agnostic mask when required. |
| `poseAsset` | No | Provider-specific pose representation when required. |
| `targetWidth` | Yes | Requested normalized output width. |
| `targetHeight` | Yes | Requested normalized output height. |
| `seed` | Yes | Reproducibility seed. |
| `qualityPreset` | Yes | Framework preset, initially `benchmark`. |
| `providerId` | Yes | Explicit provider selection. |
| `providerVersion` | Yes | Exact registered provider version. |
| `timeoutSeconds` | Yes | Maximum allowed provider execution time. |
| `consentReference` | Conditional | Approved consent reference for any real-person input. |
| `metadata` | No | Small allowlisted experiment metadata. |

Asset references must resolve through the benchmark workspace or future private
storage abstraction. They must not contain public URLs, credentials, names,
emails, or raw image bytes in logs.

### 4.2 Normalized Categories

The first framework category should be:

- `upper_body`

Future categories may include:

- `lower_body`
- `dress`

Shoes, bags, accessories, multi-garment layering, and video are unsupported
until separate capability and quality gates are defined.

### 4.3 Input Validation

Validation occurs before provider selection:

- Person and garment assets exist and are readable.
- File content is a supported image type.
- Dimensions, aspect ratio, and pixel limits are valid.
- Metadata is stripped or ignored.
- Exactly one person is present when person detection is approved.
- Garment category is supported by the selected provider version.
- Required mask or pose assets are available or can be produced by registered
  preprocessors.
- Consent and dataset usage rights are valid.
- Input hashes match the benchmark manifest.

Provider adapters may add stricter checks but cannot weaken common validation.

## 5. Common Output Contract

### 5.1 TryOnOutput

| Field | Required | Purpose |
| --- | --- | --- |
| `requestId` | Yes | Links output to the common input. |
| `status` | Yes | `succeeded`, `failed`, `rejected`, or `timed_out`. |
| `providerId` | Yes | Provider that produced the result. |
| `providerVersion` | Yes | Adapter version. |
| `modelRevision` | Yes | Pinned source/model revision. |
| `checkpointHash` | Yes | Cryptographic checkpoint identity. |
| `pipelineVersion` | Yes | Preprocessing and postprocessing pipeline version. |
| `resultAssets` | Conditional | One or more private generated-image references. |
| `seed` | Yes | Effective inference seed. |
| `width` | Conditional | Actual result width. |
| `height` | Conditional | Actual result height. |
| `timings` | Yes | Structured stage timings. |
| `resources` | Yes | Peak GPU and system resource observations. |
| `warnings` | Yes | Stable non-fatal warning codes. |
| `failure` | Conditional | Stable failure code and safe message. |
| `safetyStatus` | Yes | `passed`, `rejected`, or `not_evaluated`. |
| `createdAt` | Yes | Completion timestamp. |

### 5.2 Timings

Record separately:

- Environment or worker startup
- Model load
- Input validation
- Mask or pose preprocessing
- Core inference
- Postprocessing
- Output encoding
- Total elapsed time

Cold and warm runs must never be combined into one latency metric.

### 5.3 Resource Measurements

Record when available:

- Peak allocated GPU memory
- Peak reserved GPU memory
- Total GPU memory
- Peak system RAM
- GPU utilization samples
- CPU utilization samples
- Temporary disk usage

Missing measurements must be represented as unavailable, not zero.

### 5.4 Failure Contract

Stable framework failure codes should include:

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

Raw upstream exceptions remain in restricted local diagnostics and must not
become application-facing messages.

## 6. Provider Interface

Each provider adapter must conceptually support:

### 6.1 Descriptor

Return immutable provider metadata:

- Provider ID and adapter version
- Model family and revision
- Checkpoint identity
- Supported categories
- Supported image sizes
- Required precision and device type
- Required and optional preprocessors
- License status
- Registry approval state

### 6.2 Validate

Evaluate the common input against provider capabilities without running
inference. Return normalized validation errors and required preprocessing steps.

### 6.3 Prepare

Transform common inputs into provider-specific artifacts:

- Resize and normalize images
- Produce or validate masks
- Produce pose or parsing inputs
- Build provider-specific directory or tensor structures

Prepared artifacts remain private, temporary, versioned, and attributable to
the registered preprocessing pipeline.

### 6.4 Load And Warm

Load the pinned model and checkpoint, verify hashes, select the intended GPU,
and optionally execute a registered warm-up task.

The adapter must not download unregistered artifacts automatically.

### 6.5 Infer

Run one normalized task and return provider-native output plus stage metrics.
Batch size one is the default benchmark behavior.

### 6.6 Normalize Output

Decode and validate output, remove unnecessary metadata, map failures to stable
codes, and produce the common output contract.

### 6.7 Health

Report:

- Adapter readiness
- Model loaded state
- GPU visibility
- Available VRAM
- Artifact verification state
- Last successful inference time

Health must not include private input or result data.

### 6.8 Cleanup

Delete provider-specific temporary files and release task-scoped resources after
success, failure, rejection, or timeout.

## 7. Model Capability Matrix

Capability values must come from a registered and benchmarked revision, not
from marketing claims.

| Capability | CatVTON | IDM-VTON | StableVITON | Additional Provider |
| --- | --- | --- | --- | --- |
| Research status | Candidate | Candidate | Candidate | Unreviewed |
| Initial role | Prototype | Quality comparison | Baseline comparison | To define |
| Upper-body support | Verify | Verify | Verify | Verify |
| Lower-body support | Verify | Verify | Verify | Verify |
| Dress support | Verify | Verify | Verify | Verify |
| Mask required | Pipeline-dependent; verify | Expected; verify | Expected; verify | Verify |
| Pose/parsing required | App path uses preprocessing; verify | Expected; verify | Expected; verify | Verify |
| Arbitrary person image | Verify | Verify | Verify | Verify |
| Arbitrary garment image | Verify | Verify | Verify | Verify |
| Batch size one | Verify | Verify | Verify | Verify |
| FP16 | Verify | Verify | Verify | Verify |
| BF16 | Published path; verify locally | Verify | Verify | Verify |
| Deterministic seed | Verify | Verify | Verify | Verify |
| Maximum resolution | Benchmark | Benchmark | Benchmark | Benchmark |
| Peak VRAM | Benchmark | Benchmark | Benchmark | Benchmark |
| Commercial eligibility | Blocked pending review | Blocked pending review | Blocked pending review | Review required |
| Adapter maturity | Not implemented | Not implemented | Not implemented | Not implemented |

The matrix belongs in the model registry and must identify the exact provider
version that produced each value.

## 8. Benchmark Metrics

### 8.1 Quality

Human review remains the primary quality gate:

- Garment shape preservation
- Texture and pattern preservation
- Logo and text preservation
- Color fidelity
- Person face, hair, hand, and body preservation
- Background preservation
- Boundary quality
- Occlusion handling
- Anatomical plausibility
- Overall usefulness

Reviewers should use a fixed ordinal rubric and record rejection reasons.

Automated metrics may include:

- SSIM or LPIPS for paired benchmark subsets
- FID or KID only with a sufficiently sized, controlled set
- Perceptual garment-region similarity
- Background or non-target-region change
- Output image validity and dimensions

Automated metrics are supporting evidence. They must not replace human review
or be compared across incompatible datasets and preprocessing.

### 8.2 Performance

- Cold model-load time
- Warm inference time
- Preprocessing time
- Total time
- p50 and p95 latency after enough runs
- Peak allocated and reserved VRAM
- Peak system RAM
- Temporary disk usage
- Throughput at batch size one

### 8.3 Reliability

- Successful completion rate
- Invalid-output rate
- Preprocessing failure rate
- OOM rate
- Timeout rate
- Retry rate
- Deterministic replay consistency
- Temporary-file cleanup success

### 8.4 Safety And Privacy

- Unsafe-input rejection rate
- Unsafe-output rejection rate
- False rejection rate on approved inputs
- Metadata removal success
- Private-file retention compliance
- Log-redaction compliance

### 8.5 Segmented Quality

Report quality separately across approved dimensions:

- Skin tones
- Body presentations
- Garment colors and patterns
- Simple and complex backgrounds
- Straight and mildly occluded poses
- Light and dark garments

Segments describe benchmark coverage and must not become user identity
attributes.

## 9. Evaluation Dataset Strategy

### 9.1 Dataset Tiers

#### Tier 1: Synthetic Smoke Set

- Fully synthetic or explicitly reusable assets
- Very small
- Used for environment, contract, and failure testing
- Safe for repeated local runs

#### Tier 2: Controlled Internal Benchmark

- Team-owned or licensed images
- Explicit experiment consent for any real person
- Fixed upper-body matrix
- Used for model and preprocessing comparison
- Short media retention

#### Tier 3: Licensed Research Dataset

- VITON-HD, DressCode, or another reviewed dataset
- Used only within verified license terms
- Stored outside Git
- Dataset-specific metrics reported separately

Closed-beta user images are not an evaluation dataset and must not be reused for
benchmarking or training without separate explicit consent.

### 9.2 Dataset Manifest

Each versioned benchmark manifest should contain:

- Dataset ID and version
- Purpose and allowed use
- License or consent reference
- Input asset hashes
- Garment category
- Approved benchmark segments
- Required mask or pose asset hashes
- Retention deadline
- Reviewer rubric version

Do not store names, emails, public URLs, or private image bytes in the manifest.

### 9.3 Dataset Versioning

- Freeze a benchmark version before comparing providers.
- Add or remove samples only through a new dataset version.
- Never replace an asset while preserving its old hash or identifier.
- Report results against one exact dataset and rubric version.
- Keep provider tuning samples separate from final evaluation samples.
- Record failures rather than removing difficult samples after a run.

## 10. Model Registry

The registry is a reviewable metadata catalog. It does not contain model
weights.

### 10.1 Registry Entry

| Field | Purpose |
| --- | --- |
| `providerId` | Stable provider family identifier. |
| `providerVersion` | Adapter semantic version. |
| `modelRevision` | Exact source or model revision. |
| `checkpointId` | Internal artifact identifier. |
| `checkpointHash` | Checkpoint checksum. |
| `runtimeImageDigest` | Immutable worker environment identity. |
| `pipelineVersion` | Preprocessing and postprocessing version. |
| `capabilities` | Verified capability matrix. |
| `licenseDecision` | Research, internal, commercial, blocked, or expired. |
| `benchmarkEvidence` | Approved benchmark run references. |
| `status` | Registry lifecycle state. |
| `createdAt` | Registration time. |
| `retiredAt` | Optional retirement time. |

### 10.2 Lifecycle States

- `research`: metadata recorded; local experimentation only
- `benchmarking`: eligible for controlled benchmark runs
- `internal_approved`: approved for internal worker testing
- `beta_approved`: approved for defined closed-beta scope
- `production_approved`: approved for production selection
- `disabled`: blocked immediately
- `retired`: retained for historical result interpretation

State changes require evidence and an identified approver. A newer model
revision creates a new registry entry rather than mutating historical identity.

## 11. Versioning Strategy

### 11.1 Contract Version

Version the common input and output schemas independently using semantic
versioning:

- Patch: clarification or backward-compatible optional field
- Minor: additive capability
- Major: incompatible field or semantic change

### 11.2 Provider Version

Increment provider adapter versions when:

- Provider argument mapping changes
- Preprocessing behavior changes
- Output normalization changes
- Failure mapping changes
- Resource measurement changes

### 11.3 Pipeline Identity

One reproducible pipeline identity includes:

```text
contract version
+ provider ID and version
+ source revision
+ checkpoint hash
+ preprocessor revisions
+ runtime image digest
+ inference parameter preset
```

Every result and benchmark row must retain this identity.

### 11.4 Parameter Presets

Named presets are immutable after use:

- `smoke`
- `benchmark`
- Future approved production presets

Changing resolution, steps, guidance, precision, repaint behavior, or mask
strategy requires a new preset version.

## 12. Provider Selection

Provider selection must be policy-driven and explicit.

Selection inputs may include:

- Requested garment category
- Required resolution
- Registry approval state
- License eligibility
- GPU capability and available VRAM
- Provider health
- Benchmark quality threshold
- Latency or cost ceiling

The selected provider version must be written to the job before inference
begins. Workers must not independently substitute another model.

## 13. Fallback Strategy

### 13.1 Allowed Fallback

A fallback may occur only when:

- The primary provider fails with an allowlisted transient failure.
- The fallback provider is registered and approved for the same scope.
- Input category and preprocessing are supported.
- License and privacy rules are equivalent or stricter.
- The fallback attempt receives a new attempt record.
- The user-facing job remains traceable to the actual provider used.

Examples of potentially retryable conditions:

- Worker unavailable
- Model load transient failure
- GPU allocation unavailable
- Time-limited infrastructure interruption

### 13.2 Forbidden Fallback

Do not fall back after:

- Safety rejection
- Consent or ownership failure
- Invalid input
- Unsupported garment category
- License block
- Provider output failing a safety gate
- Explicit user or experiment provider lock

Do not silently:

- Switch to CPU
- Reduce image resolution
- Change the seed
- Change preprocessing strategy
- Use an unregistered checkpoint
- Call an external hosted provider

### 13.3 Fallback Ordering

Fallback order belongs to a versioned selection policy, not source-code
conditionals. The initial research policy should have no automatic fallback.
Benchmark runs invoke one explicit provider at a time.

Automatic fallback may be considered only after multiple providers reach the
required registry approval state and cross-provider output semantics are
validated.

## 14. Benchmark Run Record

Each run should record:

- Run ID
- Dataset and rubric versions
- Provider and full pipeline identity
- Host, driver, GPU, Python, and dependency-lock identity
- Input hashes
- Seed and preset
- Common output
- Raw metric observations
- Human review scores
- Failure and retry records
- Fallback decision
- Retention and deletion status

Run records must not contain image bytes, private URLs, storage credentials, or
personal identifiers.

## 15. Framework Acceptance Gates

Before implementing a provider adapter:

- Common input and output contracts are approved.
- Exact provider revision and checkpoint access are verified.
- License decision permits the intended research use.
- Preprocessing dependencies and input contract are understood.
- Evaluation dataset and rubric are approved.
- Hardware can run the provider with measured headroom.

Before enabling provider selection:

- Adapter contract tests pass.
- Benchmark evidence is attached to the registry entry.
- Failure and cleanup behavior are verified.
- Safety and privacy controls pass.
- Provider health and observability are available.
- Fallback policy is explicit and versioned.

## 16. Related Documents

- [CatVTON Research Notes](./CATVTON_RESEARCH.md)
- [Python Environment Plan](./PYTHON_ENV.md)
- [AI Lab Setup](../docs/AI_LAB_SETUP.md)
- [Virtual Try-On Architecture](../docs/VIRTUAL_TRY_ON_ARCHITECTURE.md)

