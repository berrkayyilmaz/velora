# Velora AI Worker

Isolated FastAPI worker foundation for remote virtual try-on execution.

This service is intentionally lightweight:

- No CatVTON imports
- No GPU dependencies
- No model downloads
- No Redis
- In-memory job storage only
- Deterministic fake inference only

## Development

```powershell
uv run ruff check src tests
uv run black --check src tests
uv run mypy
uv run pytest
uv run uvicorn src.app:app --reload --host 127.0.0.1 --port 4100
```

## Executor Modes

The worker defaults to deterministic fake execution.

```powershell
$env:VELORA_AI_WORKER_EXECUTOR_MODE="fake"
```

CatVTON research execution is opt-in only and calls the existing Velora ML CLI:

```powershell
$env:VELORA_AI_WORKER_EXECUTOR_MODE="catvton-research"
$env:VELORA_ML_PATH="C:\projects\velora\ml"
$env:CATVTON_SOURCE_PATH="C:\path\to\CatVTON"
$env:CATVTON_PERSON_IMAGE_ROOT="C:\path\to\person-images"
$env:CATVTON_CATALOG_GARMENT_ROOT="C:\path\to\catalog-garments"
$env:CATVTON_WARDROBE_GARMENT_ROOT="C:\path\to\wardrobe-garments"
$env:CATVTON_BASE_MODEL_PATH="runwayml/stable-diffusion-inpainting"
$env:CATVTON_RESUME_PATH="zhengchong/CatVTON"
$env:CATVTON_DEVICE="cuda"
$env:CATVTON_INFERENCE_STEPS="30"
$env:CATVTON_GUIDANCE_SCALE="2.5"
$env:CATVTON_WIDTH="768"
$env:CATVTON_HEIGHT="1024"
```

Additional path template options:

- `CATVTON_PERSON_IMAGE_PATH_TEMPLATE`, default `{personImageAssetId}`
- `CATVTON_CATALOG_GARMENT_PATH_TEMPLATE`, default `{productId}.png`
- `CATVTON_WARDROBE_GARMENT_PATH_TEMPLATE`, default `{wardrobeItemId}.png`

## Endpoints

- `GET /health`
- `POST /jobs`
- `GET /jobs/{workerJobId}`
- `POST /jobs/{workerJobId}/cancel`
- `GET /jobs/{workerJobId}/result`

`GET /jobs/{workerJobId}/result` exists for compatibility with the backend remote
worker client fetch-result contract.
