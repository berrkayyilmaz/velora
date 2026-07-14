# Colab Remote AI Worker Runbook

Research-only runbook for testing Velora remote virtual try-on through a temporary Google Colab worker.

Do not use production secrets, private user images, paid customer data, or generated outputs in product flows. CatVTON-related usage must remain research-only and non-commercial until licensing, model access, and data handling are approved.

## Goal

Run this flow end to end:

1. Local Velora backend creates a try-on job.
2. Backend uses `remote-http` executor mode.
3. Colab-hosted `ai-worker` receives the worker job.
4. `ai-worker` runs `catvton-research` mode through the existing Velora ML adapter.
5. Backend persists `TryOnJob` and `TryOnResult`.
6. Smoke tooling verifies the final job, result metadata, and generated artifact metadata.

## Prerequisites

- Google Colab runtime with GPU enabled.
- Local Velora backend running against local PostgreSQL.
- Local backend user access token for a test user.
- Test catalog product ID or wardrobe item ID eligible for try-on.
- Research-only person image path.
- Research-only garment image path.
- Temporary public tunnel URL for Colab port `4100`.

## Colab Setup

### 1. Enable GPU Runtime

In Colab:

```text
Runtime -> Change runtime type -> T4 GPU or equivalent -> Save
```

Verify:

```bash
python --version
nvidia-smi
```

Expected baseline from prior verified setup:

- Python: `3.12.13`
- GPU: `NVIDIA Tesla T4`
- CUDA: `12.1`
- Torch: `2.4.0`
- Torchvision: `0.19.0`
- Diffusers: `0.30.3`
- Accelerate: `0.34.2`
- Transformers: `4.46.3`
- Gradio: `4.41.0`
- fvcore: `0.1.5.post20221221`
- opencv-python: `4.10.0.84`
- huggingface-hub: `0.36.2`

### 2. Clone Velora And CatVTON

Use placeholders for repository URLs.

```bash
cd /content
git clone <VELORA_REPOSITORY_URL> velora
git clone <CATVTON_REPOSITORY_URL> CatVTON
```

Do not commit model weights, datasets, uploaded images, or generated images.

### 3. Install Verified Dependencies

Install the CatVTON research dependencies using the verified order from `ml/CATVTON_ENVIRONMENT.md`.

Template:

```bash
cd /content/CatVTON

# Placeholder: install CatVTON project dependencies.
# Use the exact dependency versions from ml/CATVTON_ENVIRONMENT.md.
pip install <VERIFIED_TORCH_COMMAND>
pip install diffusers==0.30.3 accelerate==0.34.2 transformers==4.46.3
pip install gradio==4.41.0 fvcore==0.1.5.post20221221 opencv-python==4.10.0.84 huggingface-hub==0.36.2
pip install <CATVTON_ADDITIONAL_REQUIREMENTS>
```

Restart the runtime after dependency installation if required by Colab.

### 4. Install AI Worker Dependencies

```bash
cd /content/velora/ai-worker
pip install uv
uv sync
```

Validate worker tooling:

```bash
uv run ruff check src tests
uv run black --check src tests
uv run mypy
uv run pytest
```

## Configure AI Worker

Set placeholders in Colab before starting the worker:

```bash
export VELORA_AI_WORKER_EXECUTOR_MODE="catvton-research"
export VELORA_ML_PATH="/content/velora/ml"
export CATVTON_SOURCE_PATH="/content/CatVTON"

export CATVTON_PERSON_IMAGE_ROOT="/content/velora-research-inputs/person"
export CATVTON_CATALOG_GARMENT_ROOT="/content/velora-research-inputs/catalog-garments"
export CATVTON_WARDROBE_GARMENT_ROOT="/content/velora-research-inputs/wardrobe-garments"

export CATVTON_PERSON_IMAGE_PATH_TEMPLATE="{personImageAssetId}"
export CATVTON_CATALOG_GARMENT_PATH_TEMPLATE="{productId}.png"
export CATVTON_WARDROBE_GARMENT_PATH_TEMPLATE="{wardrobeItemId}.png"

export CATVTON_BASE_MODEL_PATH="<BASE_MODEL_PATH_OR_HF_ID>"
export CATVTON_RESUME_PATH="<CATVTON_RESUME_PATH_OR_HF_ID>"
export CATVTON_DEVICE="cuda"
export CATVTON_CLOTH_TYPE="upper"
export CATVTON_SEED="42"
export CATVTON_INFERENCE_STEPS="30"
export CATVTON_GUIDANCE_SCALE="2.5"
export CATVTON_WIDTH="768"
export CATVTON_HEIGHT="1024"
export CATVTON_TIMEOUT_SECONDS="900"
```

Upload or copy research-only test images into the configured roots.

Example:

```bash
mkdir -p "$CATVTON_PERSON_IMAGE_ROOT" "$CATVTON_CATALOG_GARMENT_ROOT" "$CATVTON_WARDROBE_GARMENT_ROOT"

# Placeholder copies. Use only approved research test images.
cp <PERSON_IMAGE_PATH> "$CATVTON_PERSON_IMAGE_ROOT/<PERSON_IMAGE_ASSET_ID>"
cp <GARMENT_IMAGE_PATH> "$CATVTON_CATALOG_GARMENT_ROOT/<PRODUCT_ID>.png"
```

## Start AI Worker On Colab

```bash
cd /content/velora/ai-worker
uv run uvicorn src.app:app --host 0.0.0.0 --port 4100
```

In another Colab cell, verify locally:

```bash
curl http://127.0.0.1:4100/health
```

Expected:

```json
{"status":"ok","service":"velora-ai-worker"}
```

## Expose Port 4100 Through A Temporary Tunnel

Use a temporary tunnel only for research testing. Do not expose production credentials or private data.

Example with a placeholder tunnel tool:

```bash
# Placeholder: install and authenticate tunnel tool if required.
<INSTALL_TUNNEL_TOOL>

# Expose Colab port 4100.
<START_TUNNEL_COMMAND> 4100
```

Record the public HTTPS URL:

```text
https://<TEMPORARY_TUNNEL_HOST>
```

Verify from local machine:

```powershell
curl.exe https://<TEMPORARY_TUNNEL_HOST>/health
```

## Configure Local Backend

Use placeholders only.

```powershell
$env:TRY_ON_EXECUTOR_MODE="remote-http"
$env:TRY_ON_REMOTE_WORKER_BASE_URL="https://<TEMPORARY_TUNNEL_HOST>"
$env:TRY_ON_REMOTE_WORKER_SUBMIT_PATH="/jobs"
$env:TRY_ON_REMOTE_WORKER_STATUS_PATH="/jobs/{workerJobId}"
$env:TRY_ON_REMOTE_WORKER_CANCEL_PATH="/jobs/{workerJobId}/cancel"
$env:TRY_ON_REMOTE_WORKER_RESULT_PATH="/jobs/{workerJobId}/result"
$env:TRY_ON_REMOTE_WORKER_TIMEOUT_MS="600000"
$env:TRY_ON_REMOTE_WORKER_POLL_INTERVAL_MS="5000"
$env:TRY_ON_REMOTE_WORKER_MAX_WAIT_MS="1200000"
```

Configure smoke inputs:

```powershell
$env:TRY_ON_SMOKE_BACKEND_BASE_URL="http://127.0.0.1:4000/api/v1"
$env:TRY_ON_SMOKE_WORKER_BASE_URL="https://<TEMPORARY_TUNNEL_HOST>"
$env:TRY_ON_SMOKE_AUTH_TOKEN="<LOCAL_TEST_USER_ACCESS_TOKEN>"

$env:TRY_ON_SMOKE_PRODUCT_ID="<PRODUCT_ID>"
# Or use wardrobe item instead:
# $env:TRY_ON_SMOKE_WARDROBE_ITEM_ID="<WARDROBE_ITEM_ID>"

$env:TRY_ON_SMOKE_PERSON_IMAGE_PATH="<LOCAL_PERSON_IMAGE_PATH>"
$env:TRY_ON_SMOKE_GARMENT_IMAGE_PATH="<LOCAL_GARMENT_IMAGE_PATH>"
$env:TRY_ON_SMOKE_PERSON_IMAGE_ASSET_ID="<PERSON_IMAGE_ASSET_ID_MATCHING_COLAB_FILE>"
$env:TRY_ON_SMOKE_OUTPUT_DIRECTORY="<LOCAL_OUTPUT_METADATA_DIRECTORY>"
$env:TRY_ON_SMOKE_TIMEOUT_MS="1200000"
$env:TRY_ON_SMOKE_POLL_INTERVAL_MS="5000"
```

Important: local `TRY_ON_SMOKE_PERSON_IMAGE_PATH` and `TRY_ON_SMOKE_GARMENT_IMAGE_PATH` are validation checks for the smoke script. The actual CatVTON worker reads files from the Colab paths configured with `CATVTON_*_ROOT`.

## Run Dry Run

From local backend workspace:

```powershell
cd C:\projects\velora\backend
npm run tryon:remote-smoke -- --dry-run
```

Expected:

```text
REMOTE_CATVTON_SMOKE_DRY_RUN_OK
```

## Run Remote CatVTON Smoke

```powershell
cd C:\projects\velora\backend
npm run tryon:remote-smoke
```

Expected:

```json
{
  "status": "REMOTE_CATVTON_SMOKE_OK",
  "jobId": "<TRY_ON_JOB_ID>",
  "result": {
    "status": "ready",
    "mediaType": "image/png",
    "width": 768,
    "height": 1024
  },
  "artifact": {
    "storageKey": "<OUTPUT_ARTIFACT_PATH>",
    "mediaType": "image/png",
    "width": 768,
    "height": 1024,
    "fileSize": 123456
  }
}
```

## Verify Backend Records

Use Prisma Studio or SQL against local PostgreSQL.

Check `TryOnJob`:

- `status = SUCCEEDED`
- `provider = remote-http`
- `providerVersion = research-smoke`
- `modelVersion = research-only` or the normalized CatVTON adapter value
- `completedAt` is set
- `failureCode` and `failureMessage` are empty

Check `TryOnResult`:

- `status = READY`
- `storageKey` is set
- `mediaType = image/png`
- `width` and `height` are set
- `fileSize` is set
- `provider = remote-http`
- `modelVersion` is set

## Cleanup

Stop local backend smoke process if still running.

Stop Colab worker:

```bash
# Interrupt the uvicorn cell or terminate the process.
```

Remove research inputs and generated files from Colab:

```bash
rm -rf /content/velora-research-inputs
rm -rf /content/velora/ai-worker/data/output/*
rm -rf /content/velora/ml/data/output/*
```

Stop the temporary tunnel:

```bash
<STOP_TUNNEL_COMMAND>
```

Clear local environment variables containing tokens:

```powershell
Remove-Item Env:\TRY_ON_SMOKE_AUTH_TOKEN -ErrorAction SilentlyContinue
Remove-Item Env:\TRY_ON_REMOTE_WORKER_BASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:\TRY_ON_SMOKE_WORKER_BASE_URL -ErrorAction SilentlyContinue
```

## Common Failure Cases

### Runtime Reset

Symptoms:

- Colab worker stops responding.
- `/health` fails.
- Python packages disappear.

Fix:

- Reinstall dependencies.
- Recreate environment variables.
- Restart `uvicorn`.
- Start a new tunnel and update local backend env.

### Missing Weights

Symptoms:

- Worker job reaches `failed`.
- Error mentions Hugging Face download, checkpoint path, `resume_path`, or missing model files.

Fix:

- Confirm license and access before download.
- Confirm `CATVTON_RESUME_PATH`.
- Authenticate to Hugging Face only if allowed for research.
- Do not commit downloaded weights.

### Tunnel Expiry

Symptoms:

- Backend remote executor gets network errors.
- Dry-run worker health check fails.

Fix:

- Restart tunnel.
- Update `TRY_ON_REMOTE_WORKER_BASE_URL`.
- Update `TRY_ON_SMOKE_WORKER_BASE_URL`.
- Rerun dry-run.

### Timeout

Symptoms:

- Backend job fails with remote timeout or poll timeout.
- Colab inference continues after backend gives up.

Fix:

- Increase `TRY_ON_REMOTE_WORKER_TIMEOUT_MS`.
- Increase `TRY_ON_REMOTE_WORKER_MAX_WAIT_MS`.
- Increase `TRY_ON_SMOKE_TIMEOUT_MS`.
- Reduce inference steps for smoke testing.

### Malformed Worker URL

Symptoms:

- Backend reports remote worker URL configuration error.
- Tunnel URL lacks `https://`.
- Paths return `404`.

Fix:

- Confirm tunnel URL includes scheme.
- Confirm local backend paths:
  - `/jobs`
  - `/jobs/{workerJobId}`
  - `/jobs/{workerJobId}/cancel`
  - `/jobs/{workerJobId}/result`

### Output Artifact Not Reachable

Symptoms:

- Backend remote executor reports missing output artifact.
- Smoke script reports output artifact missing.

Fix:

- Ensure the worker returns an artifact path reachable by the backend environment.
- For local fake testing, backend and worker share the local filesystem.
- For real Colab testing, artifact transfer/storage must be solved before the backend can validate local file existence.
- This is a known research limitation until shared object storage is added.

## Known Research Limitation

The current backend execution bridge validates output artifacts with local filesystem access. A Colab-generated file path is not directly readable by the local backend unless the worker writes to shared storage or returns an artifact path mounted/reachable from the backend host.

For true remote GPU testing, use a shared storage strategy or temporary artifact download step before treating the run as fully backend-persistable.
