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

## Endpoints

- `GET /health`
- `POST /jobs`
- `GET /jobs/{workerJobId}`
- `POST /jobs/{workerJobId}/cancel`
- `GET /jobs/{workerJobId}/result`

`GET /jobs/{workerJobId}/result` exists for compatibility with the backend remote
worker client fetch-result contract.

