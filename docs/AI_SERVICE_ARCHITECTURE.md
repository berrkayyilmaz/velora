# Velora Production AI Service Architecture

Version: 1.0  
Status: Planning Draft  
Phase: Future AI Service  
Last Updated: 2026-07-13

## 1. Executive Summary

Velora should run virtual try-on through a separate asynchronous AI service,
not inside the Fastify API request cycle.

The completed `catvton-research` adapter in the `ml/` workspace is the initial
inference engine candidate. It proves the local adapter boundary and the
single-request CatVTON path, but it remains research-only until licensing,
privacy, storage, deletion, safety, and production GPU runtime requirements are
approved.

Production architecture should treat CatVTON as one provider behind a stable
provider abstraction so Velora can later replace it with a commercially approved
CatVTON variant, IDM-VTON, StableVITON, a proprietary model, or a hosted model
without changing product-facing APIs.

## 2. Design Goals

- Keep AI execution isolated from the core backend, mobile app, and admin app.
- Make try-on asynchronous because GPU inference is slow and failure-prone.
- Preserve user privacy and explicit consent.
- Avoid committing, exposing, or retaining private images longer than required.
- Support cancellation, retry, progress, monitoring, and auditability.
- Start with one model and one GPU worker, then scale horizontally.
- Keep the public API model-independent.
- Keep provider selection configurable and reversible.

## 3. Non-Goals

- No synchronous try-on response from the mobile app request.
- No model training on user images.
- No public direct access to the AI worker.
- No Gradio UI in production.
- No queue/job API implementation in this document.
- No production use of noncommercial research weights without legal approval.
- No backend/frontend runtime code changes as part of this plan.

## 4. System Architecture

```text
Expo Mobile App
    |
    | HTTPS + user auth
    v
Fastify Backend
    |-- consent validation
    |-- ownership validation
    |-- job creation
    |-- status/result APIs
    |-- cancellation APIs
    |
    +---- PostgreSQL
    |       |-- TryOnJob
    |       |-- TryOnResult
    |       |-- TryOnConsent
    |       |-- provider metadata
    |       `-- durable queue state
    |
    +---- Object Storage
    |       |-- user avatar/source inputs
    |       |-- garment input snapshots
    |       |-- generated results
    |       `-- expiring debug artifacts
    |
    `---- Internal Worker API
            |-- claim job
            |-- heartbeat/progress
            |-- complete/fail/cancel ack
            v
        Python AI Worker
            |-- provider registry
            |-- CatVTON research adapter initially
            |-- preprocessing
            |-- inference
            |-- output validation
            `-- GPU runtime
```

Only the Fastify backend is user-facing. The worker should communicate through
internal authenticated APIs or a narrowly scoped queue contract. The worker
should not receive user JWTs or broad database credentials.

## 5. Service Responsibilities

### 5.1 Fastify Backend

Responsibilities:

- Authenticate users.
- Verify try-on consent.
- Verify ownership of avatar, wardrobe item, catalog product, and result.
- Reject unsupported garment categories.
- Create idempotent try-on jobs.
- Enforce user quotas and rate limits.
- Issue scoped object-storage URLs.
- Expose job status and cancellation endpoints.
- Serve result metadata and signed result URLs.
- Record analytics events.
- Provide internal worker endpoints if a queue-only design is not used.

The backend remains the system of record. It should not import PyTorch,
CatVTON, or the `ml/` workspace.

### 5.2 AI Worker

Responsibilities:

- Load model/provider once at startup.
- Claim one job at a time per GPU unless measured concurrency says otherwise.
- Download or read scoped input files.
- Validate source image files before inference.
- Run preprocessing and mask generation.
- Execute the selected provider adapter.
- Save generated output to object storage.
- Report progress, completion, normalized failure, or cancellation.
- Delete local temporary files after each job.
- Emit structured logs and metrics.

Initial inference engine:

- `catvton-research` adapter.
- Uses the research direct inference path.
- Production release requires a commercially approved replacement or separate
  commercial permission for the full dependency chain.

### 5.3 Job Queue

Recommended MVP-friendly production path:

- PostgreSQL-backed queue using `TryOnJob` rows.
- Atomic job claim with row locking.
- Lease timeout for worker recovery.
- Heartbeat to extend active leases.
- Attempt count and retry scheduling.

Future scale path:

- Move queue transport behind an interface.
- Add Redis Streams, RabbitMQ, SQS, or managed queue only when measured queue
  pressure or operational needs justify it.

## 6. Request Lifecycle

1. User explicitly consents to try-on.
2. User selects an avatar/source image.
3. User selects a supported garment.
4. Mobile app requests a try-on job.
5. Backend validates auth, consent, ownership, category, quotas, and media.
6. Backend creates `TryOnJob` with status `queued`.
7. Worker claims the job and sets status `running`.
8. Worker downloads or resolves scoped inputs.
9. Worker validates files and prepares scratch directory.
10. Worker runs provider preprocessing and inference.
11. Worker uploads generated image and optional private debug artifacts.
12. Worker reports completion with result metadata.
13. Backend sets status `succeeded` and creates `TryOnResult`.
14. Mobile app polls or subscribes for status updates.
15. User views or deletes the result.
16. Retention policy expires source and generated media.

## 7. Job States

Recommended states:

- `queued`
- `claiming`
- `running`
- `cancel_requested`
- `cancelled`
- `succeeded`
- `failed_retryable`
- `failed_terminal`
- `expired`
- `deleted`

State transition rules:

- Only queued jobs can be claimed.
- Running jobs require worker heartbeat.
- Cancellation is best-effort while inference is active.
- Completed, terminally failed, deleted, and expired jobs are final.
- Retryable failures return to queued only through the retry scheduler.

## 8. Progress Tracking

Progress should be coarse and stable, not tied to model internals that may
change.

Suggested progress phases:

- `queued`
- `loading_inputs`
- `validating_inputs`
- `preprocessing`
- `generating`
- `uploading_result`
- `completed`
- `failed`
- `cancelled`

Each update should include:

- `jobId`
- `phase`
- `percentEstimate`
- `messageCode`
- `updatedAt`

The mobile UI should treat progress as approximate because GPU inference may
spend most time inside a single model call.

## 9. Cancellation

Cancellation behavior:

- User may request cancellation while status is `queued` or `running`.
- Queued jobs cancel immediately.
- Running jobs transition to `cancel_requested`.
- Worker checks cancellation before preprocessing, before inference, and after
  inference before upload.
- If the model call cannot be interrupted safely, the worker completes the call
  then discards output and reports `cancelled`.

Cancellation should delete temporary files and prevent result creation unless
the job already reached a final status.

## 10. Retry Policy

Retry only transient failures:

- Worker crash.
- Lease timeout.
- Temporary storage error.
- Temporary model runtime error.
- Temporary internal network failure.

Do not retry terminal failures:

- Invalid input image.
- Unsupported category.
- Missing consent.
- Ownership mismatch.
- Unsafe or disallowed content.
- License/config gate failure.

Recommended retry policy:

- Maximum attempts: 2 or 3.
- Exponential backoff with jitter.
- Retry reason stored on the job.
- Final failure includes normalized error code.

## 11. Storage Architecture

Use private object storage for all AI media.

Storage buckets or prefixes:

- `try-on/source/avatars`
- `try-on/source/garments`
- `try-on/results`
- `try-on/debug`
- `try-on/tmp`

Rules:

- Store only scoped copies needed for the job.
- Use signed URLs with short expiry.
- Do not expose raw storage paths to clients.
- Encrypt at rest.
- Keep worker scratch storage ephemeral.
- Never commit generated outputs or source images to git.

## 12. Result Retention

Suggested retention defaults:

- Source job input copies: delete after job completion plus short grace period.
- Generated results: retain until user deletion or product retention window.
- Debug artifacts: disabled by default in production; short retention if enabled.
- Failed-job scratch files: delete immediately after failure report.
- Logs: keep metadata only, not image contents.

User deletion should:

- Mark result deleted in database.
- Delete object storage result.
- Delete debug artifacts.
- Remove signed URL access.
- Preserve minimal audit metadata if required.

## 13. Provider Abstraction

The production service should use a provider-neutral contract:

```text
ProviderRequest
  requestId
  personImageUri
  garmentImageUri
  garmentCategory
  targetWidth
  targetHeight
  seed
  outputUri
  options

ProviderResult
  status
  outputUri
  durationMs
  providerId
  providerVersion
  modelId
  modelVersion
  warnings
  errorCode
  errorMessage
  metadata
```

Initial provider:

- `catvton-research`

Future providers:

- `catvton-commercial`
- `idm-vton`
- `stableviton`
- `hosted-vton-provider`
- `internal-vton-v2`

Provider rules:

- Provider implementations must normalize errors.
- Public APIs must not expose provider-specific stack traces.
- Provider metadata must be stored for reproducibility.
- Provider selection should support feature flags and per-environment config.

## 14. Future Multi-Model Support

Multi-model support should be introduced behind routing rules:

- Category: upper, lower, dress, full-body.
- Quality tier: fast preview, high quality.
- Device class: T4, L4, A10, A100.
- User cohort: internal, closed beta, production.
- Cost limit: low-cost versus premium.
- License status: research-only, approved commercial.

Model routing should be deterministic and auditable. Every result must record
which provider and model version generated it.

## 15. Cost Model

Track cost per job using:

- GPU hourly rate.
- Average model load amortization.
- Average inference duration.
- Queue wait time.
- Storage read/write volume.
- Result storage duration.
- Retry rate.
- Failure rate.
- Worker idle time.

Basic formula:

```text
costPerSuccessfulJob =
  ((gpuHourlyCost / 3600) * averageGpuSecondsPerAttempt * averageAttempts)
  + storageCostPerJob
  + orchestrationOverhead
```

Cost controls:

- One concurrent job per GPU until measured safe.
- Queue caps by environment.
- Per-user daily quota.
- Per-user monthly quota.
- Internal-only high-resolution runs.
- Disable debug artifact retention by default.
- Shut down idle GPU workers in non-production.

## 16. Horizontal Scaling

Scale dimensions:

- More worker replicas.
- More GPUs per node.
- Separate queues per model or priority.
- Separate internal/beta/production queues.
- Regional storage and workers later if needed.

Worker scaling rules:

- Worker claims jobs only when model is loaded and GPU is healthy.
- One worker process should own one GPU.
- Avoid multiple heavy model processes on the same GPU until benchmarked.
- Add queue visibility for pending/running/failed counts.
- Use graceful shutdown to stop claiming new jobs and finish or release current
  work.

## 17. Failure Handling

Normalize failures into codes:

- `input_not_found`
- `input_decode_failed`
- `unsupported_category`
- `consent_missing`
- `quota_exceeded`
- `provider_unavailable`
- `model_load_failed`
- `preprocessing_failed`
- `inference_failed`
- `gpu_out_of_memory`
- `storage_upload_failed`
- `cancelled`
- `timeout`
- `license_gate_failed`

Each failure should include:

- User-safe message code.
- Internal error details.
- Retryable flag.
- Attempt number.
- Provider/model metadata if available.

Stack traces belong in private logs, not API responses.

## 18. Monitoring

Required metrics:

- Jobs queued.
- Jobs running.
- Jobs succeeded.
- Jobs failed by code.
- Jobs cancelled.
- Average queue wait time.
- Average inference duration.
- Average end-to-end duration.
- Retry count.
- Worker heartbeat age.
- GPU utilization.
- GPU memory usage.
- Model load duration.
- Storage upload/download duration.
- Cost per successful job estimate.

Required alerts:

- Queue age exceeds threshold.
- Worker heartbeat missing.
- GPU out-of-memory spike.
- Failure rate spike.
- Storage failures.
- Cost budget threshold.
- Unexpected provider version.

## 19. Analytics

Product analytics should track user behavior without storing image contents:

- Try-on consent accepted.
- Try-on job created.
- Try-on job cancelled.
- Try-on job succeeded.
- Try-on job failed.
- Try-on result viewed.
- Try-on result deleted.
- Try-on result saved to outfit, if later supported.

Analytics event metadata:

- `userId`
- `jobId`
- `resultId`
- `sourceScreen`
- `garmentCategory`
- `providerId`
- `modelVersion`
- `durationMs`
- `status`
- `errorCode`

Do not put raw image URLs, private filenames, or generated media content into
analytics payloads.

## 20. Security And Privacy

Requirements:

- Explicit user consent before job creation.
- Per-user ownership checks on every source and result.
- Private object storage only.
- Short-lived signed URLs.
- No public worker endpoints.
- Internal service authentication.
- No user JWTs in worker.
- No training on user images.
- Local scratch cleanup after every job.
- Retention and deletion controls.
- License gate before enabling any provider.

The AI service should be disabled by default in production until legal,
security, privacy, and quality reviews pass.

## 21. Deployment Strategy

Phase 1: Internal GPU Worker

- Single queue.
- Single worker.
- Single approved internal environment.
- Synthetic or explicitly permitted assets only.
- `catvton-research` adapter only.

Phase 2: Closed Beta Worker

- Commercial/legal approval required.
- Real user consent flow.
- Private storage retention rules active.
- Quotas and cancellation active.
- Basic monitoring and alerts.

Phase 3: Production Hardening

- Multi-worker scaling.
- Provider routing.
- Cost dashboard.
- Result deletion automation.
- Incident runbooks.
- Quality regression suite.

## 22. Open Decisions

- Production queue implementation: PostgreSQL first or managed queue.
- Production GPU provider and instance type.
- Commercially approved model and checkpoint source.
- Result retention duration.
- Debug artifact policy.
- Whether cancellation must interrupt active inference or may discard output.
- Whether mobile status uses polling, push notification, or websocket.
- Whether try-on results can be attached to outfits.

## 23. Readiness Checklist

Before any closed beta:

- License gate approved for commercial/customer-facing use.
- Consent flow implemented.
- User deletion implemented.
- Storage retention implemented.
- Queue lifecycle implemented.
- Worker health checks implemented.
- Provider errors normalized.
- Monitoring and alerts live.
- Cost limits configured.
- Quality smoke suite passed.
- Security review completed.

