# Velora Self-Hosted Virtual Try-On Architecture

Version: 1.0  
Status: Planning Draft  
Phase: Future Phase 3  
Last Updated: 2026-07-01

## 1. Executive Summary

Velora should implement Virtual Try-On as an isolated, asynchronous Phase 3 capability.
It must not be embedded in existing product, wardrobe, or outfit request handlers.

The initial technical prototype should use CatVTON because its published architecture and
runtime are simpler than IDM-VTON and StableVITON. The official CatVTON repository describes
a 899.06M-parameter model and inference below 8 GB VRAM at 1024x768, making it the lowest-risk
candidate for a single-GPU prototype.

CatVTON, IDM-VTON, and StableVITON are all published under CC BY-NC-SA 4.0 terms. Those terms
are non-commercial. They are suitable for technical evaluation only unless Velora obtains
separate commercial permission or replaces the prototype with commercially compatible code,
weights, base models, and datasets.

No closed beta or production release may use research weights until a documented legal and
licensing review approves the complete dependency chain.

## 2. Product Boundary

### 2.1 Goal

Allow an explicitly consenting user to generate a private visual estimate of one supported
garment on a user-provided avatar image.

The result is an AI-generated preview. It is not a sizing, fit, fabric, or purchase guarantee.

### 2.2 Initial Supported Scenario

- One consenting user
- One private, front-facing avatar image
- One supported upper-body garment
- One generated result
- Asynchronous processing
- Private result review and deletion

Upper-body garments should be the first evaluated category. Dresses and lower-body garments
may be enabled only after category-specific quality gates pass.

### 2.3 Excluded From Initial Phase 3

- Multi-garment layering
- Complete outfit generation in one inference
- Shoes, bags, jewelry, and accessories
- Video try-on
- Real-time or AR try-on
- Size or fit prediction
- Body measurement inference
- Public sharing or social feeds
- Automatic purchase decisions
- Face recognition or identity matching
- Model training on user images

## 3. Model Candidate Comparison

| Area | CatVTON | IDM-VTON | StableVITON |
| --- | --- | --- | --- |
| Primary design | Single simplified diffusion UNet using spatial concatenation | SDXL-based architecture with visual encoder and parallel UNet garment conditioning | Latent diffusion with learned semantic correspondence |
| Published strength | Efficient inference and simplified conditioning | Strong garment fidelity and in-the-wild authenticity | Clothing detail preservation through semantic correspondence |
| Preprocessing | Model removes pose, parsing, and text conditions; a try-on mask is still required and may need automatic generation | Demo pipeline uses human parsing, DensePose, OpenPose, masking, and garment captions | Requires agnostic mask and DensePose; arbitrary images need additional preprocessing |
| Published runtime signal | Less than 8 GB VRAM for 1024x768 in the official repository | Higher expected memory and operational cost due to SDXL and additional encoders; benchmark required | Older pinned dependency stack and multiple preprocessing inputs |
| Operational complexity | Lowest of the three | Highest | Medium to high |
| Prototype role | Recommended first candidate | Quality comparison candidate | Baseline comparison candidate |
| Published license | CC BY-NC-SA 4.0 | CC BY-NC-SA 4.0 | CC BY-NC-SA 4.0 |
| Commercial release status | Blocked without separate permission or replacement | Blocked without separate permission or replacement | Blocked without separate permission or replacement |

### 3.1 Recommendation

Use CatVTON for the local and internal technical prototype because:

- Its official implementation has the lowest published VRAM requirement of the candidates.
- It removes separate pose, parsing, and text conditions from model inference.
- Its single-UNet design reduces the initial deployment and debugging surface.
- It supports a practical first benchmark at 768x1024 or 1024x768.

This is a prototype recommendation, not a production model decision.

Before adoption, Velora must verify:

- Quality on Velora-approved avatar and garment images
- Mask-generation reliability
- Latency on the selected GPU
- Peak VRAM including preprocessing and model warm-up
- Behavior across skin tones, body shapes, poses, and garment patterns
- All code, checkpoint, base-model, and dataset licenses
- Availability of commercial permission or a commercially compatible replacement

IDM-VTON should be the second comparison candidate when garment fidelity is more important
than operational simplicity. StableVITON should be retained as a reproducible baseline but
is not recommended as the first service implementation because of its preprocessing and
dependency burden.

## 4. Recommended System Architecture

```text
Expo Mobile App
    |
    | HTTPS + user JWT
    v
Fastify Try-On API
    |-- consent and ownership validation
    |-- avatar upload authorization
    |-- job creation and status
    |-- result access and deletion
    |
    +---- PostgreSQL
    |       |-- try-on data models
    |       |-- durable job queue and leases
    |       `-- transactional outbox/audit metadata
    |
    +---- Private S3-Compatible Storage
    |       |-- avatar source media
    |       |-- transient garment/input copies
    |       `-- generated results
    |
    `---- Internal Worker API
            |-- authenticated job claim
            |-- heartbeat/progress
            |-- completion/failure
            v
        Python AI Inference Worker
            |-- input validation and preprocessing
            |-- CatVTON prototype adapter
            |-- output safety validation
            `-- NVIDIA GPU Runtime
```

Only the Fastify API is user-facing. The worker must not receive user JWTs, query general
user tables, or hold broad database credentials.

## 5. Required Services

### 5.1 Fastify Try-On Job API

Responsibilities:

- Authenticate the user.
- Verify current consent.
- Verify ownership of avatar, garment source, wardrobe item, and result.
- Reject unsupported categories and incomplete media.
- Enforce per-user quotas and rate limits.
- Create idempotent jobs.
- Expose job status and short-lived result URLs.
- Coordinate cancellation, retention, and deletion.
- Expose a separate authenticated internal worker contract.

The existing Fastify backend remains the system of record and orchestration boundary.

### 5.2 AI Inference Worker

Recommended runtime:

- Python
- PyTorch
- Diffusers-compatible model adapter where practical
- A small internal service or worker process; FastAPI may expose health endpoints, but it
  must not become a second public API
- One model adapter interface so CatVTON can be replaced without changing public contracts

Worker responsibilities:

- Claim one leased job.
- Fetch inputs using short-lived signed URLs.
- Validate dimensions, MIME type, decodeability, and category.
- Generate or validate the required mask.
- Run inference with pinned model and parameter versions.
- Validate output decodeability and safety.
- Upload the result through a scoped signed URL.
- Report structured completion or failure.
- Delete all local temporary files after every attempt.

The worker must not persist source images on its container filesystem.

### 5.3 GPU Runtime

Initial runtime:

- Linux host
- NVIDIA GPU
- NVIDIA Container Toolkit
- Pinned CUDA, cuDNN, PyTorch, and model revisions
- One worker process and one concurrent job per GPU
- Warm model process to avoid loading weights for every job
- Read-only model cache mounted separately from job scratch space

Although CatVTON publishes inference below 8 GB VRAM, Velora should prototype with at least
12 GB VRAM and prefer 16 GB to allow preprocessing, framework overhead, and safe headroom.
Actual concurrency must be set from measured peak VRAM, not the published model figure.

The runtime must expose:

- GPU availability
- Model-loaded readiness
- Current job ID
- VRAM usage
- Inference duration
- Out-of-memory restart count

### 5.4 Durable Job Queue

For the first internal and closed-beta versions, use a PostgreSQL-backed logical queue rather
than adding a separate broker:

- `TryOnJob` stores durable status and attempts.
- Fastify claims queued work atomically using row locking and `SKIP LOCKED`.
- A lease expiration allows recovery after worker termination.
- The worker long-polls an authenticated internal claim endpoint.
- Heartbeats extend the lease.
- Completion and failure updates use compare-and-set status transitions.

This keeps the initial infrastructure small and allows the worker to avoid direct database
access. If measured throughput or queue contention becomes material, the queue may move to
Redis Streams or RabbitMQ behind the same queue interface.

Queue requirements:

- At-least-once delivery
- Idempotent processing by job ID
- Bounded retry count
- Exponential retry delay for transient failures
- No retry for invalid inputs, consent withdrawal, or safety rejection
- Dead-letter state for operational review
- Cancellation checks before preprocessing and before result publication

### 5.5 Private Storage

Use S3-compatible private object storage. MinIO is suitable for local and self-hosted
environments; production may use a managed S3-compatible service if approved.

Separate storage prefixes or buckets:

- `try-on-avatars`
- `try-on-inputs`
- `try-on-results`

Rules:

- No public buckets or permanent public URLs.
- Mobile receives short-lived signed upload/read URLs only.
- Worker receives job-scoped signed GET and PUT URLs.
- Storage keys never appear in mobile responses, analytics, or logs.
- Server-side encryption is required.
- Object metadata must not contain email, display name, or raw user ID.
- EXIF and location metadata must be removed before durable storage.
- Production buckets must have lifecycle rules matching database retention.

## 6. Processing Flow

1. User opens Try-On and reviews the current purpose, retention, limitations, and safety
   notice.
2. User grants versioned consent.
3. Fastify authorizes an avatar upload and returns a short-lived signed URL.
4. Client uploads the avatar directly to private storage and confirms completion.
5. Fastify validates media metadata and marks the avatar ready.
6. User selects one supported catalog or owned wardrobe garment.
7. Client submits a job with an idempotency key.
8. Fastify verifies consent, ownership, media readiness, category, and quota.
9. Fastify creates a queued `TryOnJob`.
10. Worker claims the job through the internal API.
11. Fastify returns scoped input and output URLs plus the pinned model configuration.
12. Worker downloads inputs, preprocesses them, runs inference, validates output, and uploads
    the result.
13. Worker reports completion; Fastify creates `TryOnResult` and marks the job succeeded.
14. Mobile polls or refreshes job status and receives a short-lived result URL.
15. Retention, user deletion, or consent withdrawal schedules idempotent object deletion.

## 7. Data Model Plan

### 7.1 UserAvatar

Purpose: store metadata for a private user-owned try-on source image.

Fields:

| Field | Required | Notes |
| --- | --- | --- |
| `id` | Yes | UUID primary key |
| `userId` | Yes | Owning user |
| `storageKey` | Yes | Internal private key; unique and never returned |
| `mediaType` | Yes | Approved image MIME type |
| `fileSize` | Yes | Validated byte size |
| `width` | Yes | Validated width |
| `height` | Yes | Validated height |
| `checksum` | Yes | Integrity and duplicate detection |
| `status` | Yes | `UPLOADING`, `VALIDATING`, `READY`, `INVALID`, `DELETION_PENDING`, `DELETED` |
| `qualityCode` | No | Controlled failure/quality code, not free-form analysis |
| `createdAt` | Yes | Creation timestamp |
| `updatedAt` | Yes | Update timestamp |
| `lastUsedAt` | No | Supports inactivity retention |
| `deletedAt` | No | Completed logical deletion |

Relationships and constraints:

- `User 1:N UserAvatar`
- Only the owner can access the record.
- A user may have one active primary avatar initially.
- Deleted avatars remain unavailable even if physical object deletion is retrying.

No body measurements, face embeddings, inferred demographics, or biometric templates belong
in this model.

### 7.2 TryOnConsent

Purpose: retain immutable evidence of purpose-specific user consent.

Fields:

| Field | Required | Notes |
| --- | --- | --- |
| `id` | Yes | UUID primary key |
| `userId` | Yes | Consenting user |
| `policyVersion` | Yes | Exact privacy/retention text version |
| `purposeVersion` | Yes | Exact try-on processing purpose version |
| `locale` | Yes | Language presented to the user |
| `grantedAt` | Yes | Consent timestamp |
| `withdrawnAt` | No | Withdrawal timestamp |
| `createdAt` | Yes | Record creation timestamp |

Relationships and constraints:

- `User 1:N TryOnConsent`
- `TryOnJob N:1 TryOnConsent`
- New consent creates a new versioned record.
- Historical evidence is retained separately from images and results.
- A withdrawn or superseded consent cannot authorize new jobs.

### 7.3 TryOnJob

Purpose: represent one asynchronous generation request and durable queue item.

Fields:

| Field | Required | Notes |
| --- | --- | --- |
| `id` | Yes | UUID primary key |
| `userId` | Yes | Owning user |
| `consentId` | Yes | Consent version used |
| `avatarId` | Yes | Ready owned avatar |
| `sourceType` | Yes | `CATALOG_PRODUCT` or `WARDROBE_ITEM` |
| `productId` | Conditional | Required for catalog source |
| `wardrobeItemId` | Conditional | Required for wardrobe source |
| `categoryId` | Yes | Validated category snapshot |
| `status` | Yes | Job state |
| `idempotencyKey` | Yes | Unique per user |
| `modelFamily` | Yes | Example: `catvton` |
| `modelVersion` | Yes | Immutable checkpoint/version identifier |
| `pipelineVersion` | Yes | Pre/postprocessing version |
| `attemptCount` | Yes | Retry count |
| `maxAttempts` | Yes | Retry ceiling |
| `leaseOwner` | No | Current worker identity |
| `leaseExpiresAt` | No | Crash recovery lease |
| `progressStage` | No | Controlled stage value |
| `failureCode` | No | Controlled non-sensitive error code |
| `requestedAt` | Yes | Queue timestamp |
| `startedAt` | No | First processing timestamp |
| `completedAt` | No | Terminal timestamp |
| `canceledAt` | No | Cancellation timestamp |
| `expiresAt` | Yes | Job metadata retention deadline |
| `createdAt` | Yes | Creation timestamp |
| `updatedAt` | Yes | Update timestamp |

Recommended states:

```text
QUEUED
CLAIMED
VALIDATING
PREPROCESSING
RUNNING
UPLOADING_RESULT
SUCCEEDED
FAILED
CANCELED
DELETION_PENDING
DELETED
```

Constraints:

- Unique `(userId, idempotencyKey)`.
- Exactly one source ID must match `sourceType`.
- Worker transitions require the current lease and expected prior status.
- A job never stores signed URLs, raw prompts, image bytes, or worker stack traces.

### 7.4 TryOnResult

Purpose: store metadata for one private generated image.

Fields:

| Field | Required | Notes |
| --- | --- | --- |
| `id` | Yes | UUID primary key |
| `jobId` | Yes | Unique owning job |
| `userId` | Yes | Denormalized ownership boundary |
| `storageKey` | Yes | Internal private result key |
| `mediaType` | Yes | Output MIME type |
| `fileSize` | Yes | Validated bytes |
| `width` | Yes | Output width |
| `height` | Yes | Output height |
| `checksum` | Yes | Integrity verification |
| `modelFamily` | Yes | Generation model |
| `modelVersion` | Yes | Exact checkpoint revision |
| `pipelineVersion` | Yes | Exact processing revision |
| `seed` | No | Reproducibility when supported |
| `safetyStatus` | Yes | `PENDING`, `APPROVED`, `REJECTED` |
| `createdAt` | Yes | Creation timestamp |
| `expiresAt` | Yes | Physical deletion deadline |
| `deletedAt` | No | Completed deletion timestamp |

Relationships and constraints:

- `TryOnJob 1:0..1 TryOnResult`
- Result ownership must match job ownership.
- Rejected outputs are never exposed to the user.
- Storage key and model-internal paths are never returned.

## 8. API Proposal

All public endpoints require user authentication.

### 8.1 Consent

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/try-on/consent` | Return current consent requirement and user status |
| POST | `/api/v1/try-on/consent` | Grant the exact current policy and purpose versions |
| DELETE | `/api/v1/try-on/consent` | Withdraw consent and begin cancellation/deletion workflow |

Consent request:

```json
{
  "policyVersion": "try-on-privacy-v1",
  "purposeVersion": "virtual-try-on-v1",
  "accepted": true
}
```

### 8.2 Avatar

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/v1/try-on/avatars/upload-request` | Authorize one private avatar upload |
| POST | `/api/v1/try-on/avatars/confirm` | Verify uploaded object and create/activate metadata |
| GET | `/api/v1/try-on/avatars` | Return owned avatar metadata and short-lived read URLs |
| DELETE | `/api/v1/try-on/avatars/:avatarId` | Delete avatar and dependent temporary data |

Upload authorization accepts MIME type and file size. Confirmation accepts only an opaque
upload reference issued by Fastify.

### 8.3 Jobs And Results

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/v1/try-on/jobs` | Create an idempotent asynchronous job |
| GET | `/api/v1/try-on/jobs` | List owned jobs with pagination |
| GET | `/api/v1/try-on/jobs/:jobId` | Return owned job status and result metadata |
| POST | `/api/v1/try-on/jobs/:jobId/cancel` | Cancel a non-terminal job |
| DELETE | `/api/v1/try-on/jobs/:jobId` | Delete result and user-visible job data |
| DELETE | `/api/v1/try-on/results/:resultId` | Delete one owned generated result |

Create job request:

```json
{
  "avatarId": "uuid",
  "source": {
    "type": "catalog_product",
    "id": "uuid"
  },
  "idempotencyKey": "client-generated-uuid"
}
```

Job response:

```json
{
  "data": {
    "id": "uuid",
    "status": "queued",
    "progressStage": null,
    "failureCode": null,
    "result": null,
    "requestedAt": "ISO-8601",
    "expiresAt": "ISO-8601"
  }
}
```

When succeeded, `result` includes metadata and a short-lived signed URL. It does not include
the storage key.

### 8.4 Internal Worker Contract

These endpoints require a separate service identity, network restriction, and replay-safe
request signing. User JWTs are not accepted.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/internal/try-on/jobs/claim` | Lease the next eligible job |
| POST | `/internal/try-on/jobs/:jobId/heartbeat` | Extend an active lease |
| POST | `/internal/try-on/jobs/:jobId/progress` | Record a controlled stage transition |
| POST | `/internal/try-on/jobs/:jobId/complete` | Verify result object and complete job |
| POST | `/internal/try-on/jobs/:jobId/fail` | Record structured failure and retry decision |

The claim response contains only:

- Job ID
- Model and pipeline version
- Supported category
- Short-lived input GET URLs
- One result PUT URL
- Lease token and expiration

## 9. Consent Flow

Consent must be:

- Explicit
- Purpose-specific
- Versioned
- Unbundled from general account terms
- Revocable
- Recorded before avatar upload or generation

The screen must state:

- Which images are processed
- Why they are processed
- That a self-hosted AI model performs generation
- Retention periods
- How deletion and withdrawal work
- That the output is generated and may be inaccurate
- That it does not predict size or fit
- That unsupported or unsafe images are rejected

No consent checkbox may be preselected.

Consent withdrawal must:

1. Prevent new uploads and jobs immediately.
2. Cancel queued jobs.
3. Prevent unpublished running results from becoming visible.
4. Mark avatars and results deletion-pending.
5. Delete storage objects through an idempotent deletion workflow.
6. Preserve only the minimum consent evidence required by approved policy.

## 10. Generated Image Retention And Deletion

### 10.1 Baseline Retention

| Data | Local Prototype | Internal Worker | Closed Beta Default |
| --- | --- | --- | --- |
| Avatar source | Approved synthetic/test data only; delete after test | Maximum 24 hours | Until user deletion/withdrawal or 90 days of inactivity |
| Transient garment/input copy | Delete after job | Maximum 24 hours | Maximum 24 hours |
| Generated result | Delete after evaluation | Maximum 24 hours | 7 days unless user deletes sooner |
| Failed-job temporary files | Immediate cleanup | Maximum 1 hour | Maximum 1 hour |
| Job metadata without media | Development only | 30 days | 90 days |
| Consent evidence | Test only | Versioned policy period | Approved legal retention period |

Production may allow an explicit save action, but the initial maximum result retention should
not exceed 30 days without a separate privacy decision.

### 10.2 Deletion Guarantees

- User-facing access ends immediately when deletion is requested.
- Primary storage deletion should complete within 24 hours.
- Retryable deletion failures remain `DELETION_PENDING`.
- Backup copies expire through the documented backup lifecycle, targeted at 30 days.
- Database and object deletion are idempotent.
- Account deletion and consent withdrawal use the same orchestrated deletion mechanism.
- Deletion metrics contain IDs and status only, never image content or signed URLs.

## 11. Privacy And Security Rules

- Treat avatars and results as sensitive private media.
- Do not add body images or measurements to the base `User` table.
- Do not use user media for training, fine-tuning, evaluation publication, or manual review
  without separate explicit consent.
- Do not perform face recognition, demographic inference, or biometric identification.
- Encrypt media in transit and at rest.
- Use short-lived signed URLs scoped to one object and operation.
- Redact storage keys, signed URLs, queue payloads, and image-derived data from logs.
- Do not copy raw images into PostgreSQL, analytics, traces, crash reports, or support tools.
- Existing admin access does not grant access to try-on media.
- Any exceptional support access requires a separate audited approval workflow.
- Worker containers run without public ingress and with least-privilege service credentials.
- Model artifacts must be checksum-pinned and scanned before deployment.
- Dependency and container images must be reproducible and vulnerability-scanned.
- Production requires a documented privacy impact assessment and threat model.

## 12. Safety Rules

### 12.1 Input Safety

- Closed beta is restricted to authenticated adults.
- User must confirm they own or are authorized to use the avatar image.
- Reject nudity, sexual content, exploitative content, and suspected non-consensual imagery.
- Reject unsupported image types, extreme crops, multiple people, and insufficient resolution.
- Reject unsupported garment categories before queueing.
- Do not allow arbitrary text prompts in the initial release.

### 12.2 Output Safety

- Run output validation before publication.
- Never publish a result that failed safety checks.
- Keep results private.
- Label results as AI-generated visual previews.
- Do not claim accurate body shape, size, fit, or fabric behavior.
- Do not silently replace catalog, wardrobe, or avatar source images.
- Store controlled safety codes only; do not retain image descriptions in generic logs.

### 12.3 Quality And Fairness

Evaluation sets must cover:

- Skin tones
- Body shapes and sizes
- Mobility aids where supported
- Different poses and backgrounds
- Garment colors, patterns, text, transparency, and occlusion

Launch requires category-specific thresholds for:

- Garment identity preservation
- Person identity preservation
- Anatomical artifacts
- Background corruption
- Safety rejection accuracy
- Failure rate
- Median and p95 latency

## 13. Observability And Operational Controls

Track:

- Queue depth and oldest queued age
- Jobs by status and failure code
- Claim and lease expiration rates
- Retry and dead-letter rates
- Input validation rejection rates
- GPU utilization and peak VRAM
- Model warm-up and inference latency
- Result upload and deletion latency
- Storage growth by media purpose
- Consent withdrawal and deletion completion

Do not track:

- Image bytes
- Signed URLs
- Storage keys
- Face or body embeddings
- Free-form model descriptions of a person

Initial operational targets should be set after local benchmarking. The closed beta must
have explicit concurrency, daily job, and per-user quota limits.

## 14. Rollout Plan

### Phase 1: Local Prototype

Environment:

- One developer Linux workstation
- One NVIDIA GPU
- Local CatVTON checkout pinned to an exact commit
- Local filesystem
- No user accounts or real customer media
- Approved synthetic or team-owned test images only

Deliverables:

- Reproducible container or environment
- Model adapter interface
- Input/output manifest
- Fixed benchmark set
- VRAM, latency, and quality report
- CatVTON, IDM-VTON, and StableVITON comparison samples
- Complete dependency and license inventory

Exit criteria:

- CatVTON runs reproducibly.
- Temporary files are deleted after every run.
- Quality and runtime evidence supports continued work.
- Legal review permits internal evaluation.

### Phase 2: Internal GPU Worker

Environment:

- Private Linux GPU host
- Containerized Python worker
- Fastify internal worker API
- PostgreSQL-backed durable queue
- Private MinIO storage
- Synthetic and explicitly approved internal images

Deliverables:

- Job leases, heartbeat, retries, cancellation, and dead-letter handling
- Signed input/output URLs
- Model warm-up and readiness checks
- Structured failure codes
- Automated retention and deletion
- GPU and queue monitoring

Exit criteria:

- Worker restart does not lose jobs.
- Duplicate delivery does not create duplicate results.
- Storage and local scratch cleanup tests pass.
- Unauthorized media access tests pass.
- Peak VRAM, p95 latency, and failure rates are measured.

### Phase 3: Closed Beta Try-On

Prerequisites:

- Commercially valid model and dependency rights
- Approved privacy impact assessment
- Approved consent and retention text
- Safety and fairness benchmark approval
- Documented incident and deletion procedures

Scope:

- Small invitation-only adult cohort
- Upper-body garments only
- One avatar and one garment per job
- Strict daily and concurrent quotas
- Seven-day default result retention
- No sharing, training, or manual media review

Exit criteria:

- Consent and withdrawal work end to end.
- Account deletion removes all try-on media.
- Quality threshold passes across approved evaluation segments.
- Safety incidents remain within approved threshold.
- GPU capacity and cost are understood.
- Support load is acceptable.

### Phase 4: Production Hardening

Work:

- Multi-worker scheduling and GPU capacity planning
- Queue isolation and priority controls
- Automated GPU recovery and safe deployment draining
- Model canary releases and rollback
- Encrypted backups and tested deletion lifecycle
- Security review, penetration testing, and dependency scanning
- Regional storage and data residency controls
- Production SLOs, alerts, and incident response
- Commercial model replacement or licensed checkpoint governance

Production release requires separate approval. Completion of a closed beta does not
automatically authorize general availability.

## 15. Key Risks And Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Non-commercial model licenses | Blocks commercial beta and production | Legal review, obtain permission, or replace model and dependencies |
| Dataset or base-model license restrictions | Hidden commercial or redistribution risk | Maintain a complete software/model/dataset bill of materials |
| Poor quality across body types or skin tones | User harm and low trust | Segmented evaluation, limited categories, strict launch thresholds |
| Misleading fit expectations | Purchase dissatisfaction | Persistent visual-estimate disclaimer; no fit or size claims |
| GPU memory or latency spikes | Job failure and poor UX | One job per GPU, warm worker, measured limits, OOM recovery |
| Worker crash or duplicate delivery | Lost or duplicate results | Durable leases, idempotent completion, unique result per job |
| Sensitive media leakage | Severe privacy impact | Private storage, short-lived URLs, log redaction, isolated worker |
| Deletion failure | Privacy and compliance breach | Immediate access revocation, deletion-pending state, retries and alerts |
| Low-quality masks | Visible artifacts | Input validation, deterministic mask evaluation, retry guidance |
| Unsupported categories or layering | Unreliable results | Upper-body-only launch and server-side category allowlist |
| Model supply-chain compromise | Worker or data compromise | Pinned checksums, private artifact registry, container scanning |

## 16. Decisions Required Before Implementation

1. Confirm whether internal CatVTON evaluation is permitted under the published license.
2. Identify a commercially compatible production model or licensing path.
3. Approve the initial avatar and garment image requirements.
4. Approve upper-body-only prototype scope.
5. Select the local and internal GPU hardware.
6. Approve MinIO or another S3-compatible private storage implementation.
7. Approve closed-beta retention periods and launch geography.
8. Approve safety classifiers and escalation policy.
9. Approve consent text and privacy impact assessment ownership.
10. Define model quality, fairness, latency, and failure-rate gates.

## 17. Sources

- [CatVTON official repository](https://github.com/Zheng-Chong/CatVTON)
- [CatVTON paper](https://arxiv.org/abs/2407.15886)
- [IDM-VTON official repository](https://github.com/yisol/IDM-VTON)
- [IDM-VTON project page](https://idm-vton.github.io/)
- [IDM-VTON paper](https://arxiv.org/abs/2403.05139)
- [StableVITON official repository](https://github.com/rlawjdghek/StableVITON)
- [StableVITON paper](https://arxiv.org/abs/2312.01725)

Model capabilities, dependencies, checkpoints, and licenses must be re-verified against exact
revisions before implementation. This document is technical planning, not legal advice.
