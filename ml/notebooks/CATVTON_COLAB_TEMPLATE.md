# CatVTON Colab Notebook Template

Status: Research Only  
Last Updated: 2026-07-09

## Purpose

This Markdown file defines the intended cell structure for a future Google
Colab notebook used to evaluate CatVTON-style virtual try-on models.

This is not an executable notebook. Do not copy placeholder commands into a
runtime until license, model source, weights access, and input asset permission
have been verified.

## Rules

- Do not use real Velora user images.
- Do not use private wardrobe images.
- Do not use copyrighted retailer or social media images.
- Do not commit model weights, datasets, generated outputs, or notebook files.
- Treat every model clone, weight download, dependency install, and inference
  command below as a placeholder until verified.
- Stop immediately if the license gate is not satisfied.

## Cell 1: Runtime And GPU Check

Purpose:

- Confirm Colab runtime details.
- Confirm a CUDA GPU is available.
- Record environment information for the experiment log.

Placeholder cell:

```python
import os
import platform
import sys

print("python:", sys.version)
print("platform:", platform.platform())
print("cwd:", os.getcwd())

!nvidia-smi || true

try:
    import torch

    print("torch:", torch.__version__)
    print("cuda_available:", torch.cuda.is_available())
    if torch.cuda.is_available():
        print("gpu:", torch.cuda.get_device_name(0))
except Exception as exc:
    print("torch_check_error:", repr(exc))
```

Stop condition:

- If no CUDA GPU is available, stop the experiment and log the environment as
  blocked.

## Cell 2: Workspace Setup

Purpose:

- Create a temporary, isolated Colab workspace.
- Keep inputs, outputs, logs, repositories, and model files separate.

Placeholder cell:

```python
from pathlib import Path

BASE_DIR = Path("/content/velora-ai-lab")

for path in [
    BASE_DIR / "repos",
    BASE_DIR / "models",
    BASE_DIR / "data" / "input" / "persons",
    BASE_DIR / "data" / "input" / "garments",
    BASE_DIR / "data" / "input" / "masks",
    BASE_DIR / "data" / "output" / "images",
    BASE_DIR / "data" / "output" / "benchmark",
    BASE_DIR / "logs",
    BASE_DIR / "reports",
]:
    path.mkdir(parents=True, exist_ok=True)

print("workspace:", BASE_DIR)
```

## Cell 3: License Confirmation Gate

Purpose:

- Force a manual checkpoint before any model clone, dependency install, or
  weights download.

Checklist:

- CatVTON source repository verified.
- CatVTON license reviewed.
- Weights source verified.
- Commercial restrictions understood.
- Dataset/input restrictions understood.
- Attribution requirements understood.
- Experiment status recorded as `research-only` or `approved`.
- Synthetic or explicitly permitted input assets prepared.

Placeholder cell:

```python
LICENSE_GATE_CONFIRMED = False

if not LICENSE_GATE_CONFIRMED:
    raise RuntimeError(
        "License gate is not confirmed. Review ml/MODEL_LICENSE_GATE.md before continuing."
    )
```

Do not set `LICENSE_GATE_CONFIRMED = True` until the gate has been reviewed for
the exact model, checkpoint, and experiment scope.

## Cell 4: Repository Clone Placeholder

Purpose:

- Reserve a cell for cloning the verified model repository at a fixed revision.

Placeholder cell:

```python
# PLACEHOLDER ONLY.
# Verify repository URL, license, and commit before running.
#
# CATVTON_REPO_URL = "<verified-catvton-repo-url>"
# CATVTON_COMMIT = "<verified-commit-sha>"
# REPO_DIR = BASE_DIR / "repos" / "catvton"
#
# !git clone {CATVTON_REPO_URL} {REPO_DIR}
# %cd {REPO_DIR}
# !git checkout {CATVTON_COMMIT}
```

Required log fields:

- Repository URL.
- Commit SHA.
- Clone time.
- Any repository warnings.

## Cell 5: Dependency Install Placeholder

Purpose:

- Reserve a cell for installing verified dependencies.

Placeholder cell:

```python
# PLACEHOLDER ONLY.
# Use verified upstream instructions and pinned versions.
#
# !python -m pip install --upgrade pip
# !pip install torch torchvision --index-url <verified-cuda-index>
# !pip install -r {REPO_DIR / "requirements.txt"}
```

Rules:

- Do not install dependencies before the license gate.
- Pin versions after the first successful run.
- Record package versions in the experiment log.
- Restart runtime only if required and log the restart.

## Cell 6: Model Download Placeholder

Purpose:

- Reserve a cell for downloading verified model weights.

Placeholder cell:

```python
# PLACEHOLDER ONLY.
# Verify weights license, source, and checksum before running.
#
# MODEL_DIR = BASE_DIR / "models" / "catvton"
# MODEL_DIR.mkdir(parents=True, exist_ok=True)
# !python <verified-download-script>.py --output {MODEL_DIR}
```

Rules:

- Do not mirror or redistribute weights unless explicitly permitted.
- Do not store weights in Google Drive unless approved.
- Do not commit weights to the Velora repository.

## Cell 7: Input Upload Cell

Purpose:

- Upload synthetic or explicitly permitted person, garment, and optional mask
  inputs.

Placeholder cell:

```python
# PLACEHOLDER ONLY.
# Use only synthetic or explicitly permitted input assets.
#
# from google.colab import files
# uploaded = files.upload()
# for name, data in uploaded.items():
#     target = BASE_DIR / "data" / "input" / name
#     target.write_bytes(data)
#     print("uploaded:", target)
```

Input rules:

- No real Velora user images.
- No private wardrobe images.
- No retailer images without permission.
- No social media images.
- No images containing minors.
- No assets with unclear ownership.

## Cell 8: Input Validation And Preview

Purpose:

- Validate image readability and basic dimensions before inference.

Placeholder cell:

```python
from pathlib import Path
from PIL import Image

def inspect_image(path: Path) -> dict:
    with Image.open(path) as image:
        return {
            "path": str(path),
            "format": image.format,
            "mode": image.mode,
            "size": image.size,
        }

# person_path = BASE_DIR / "data" / "input" / "persons" / "sample_person.png"
# garment_path = BASE_DIR / "data" / "input" / "garments" / "sample_garment.png"
# print(inspect_image(person_path))
# print(inspect_image(garment_path))
```

Validation checklist:

- Files exist.
- Files open as images.
- Dimensions are reasonable for the model.
- Orientation is correct.
- Garment category is recorded.
- Optional mask is present only when required.

## Cell 9: Inference Command Placeholder

Purpose:

- Reserve a cell for the verified single-sample inference command.

Placeholder cell:

```python
# PLACEHOLDER ONLY.
# Replace with verified upstream CatVTON inference command.
#
# request_id = "catvton-colab-smoke-001"
# output_path = BASE_DIR / "data" / "output" / "images" / f"{request_id}.png"
#
# !python inference.py \
#   --person <person_path> \
#   --garment <garment_path> \
#   --category upper_body \
#   --output {output_path} \
#   --seed 42
#
# assert output_path.exists(), "Expected output image was not created."
```

Rules:

- Run one sample only for the first smoke test.
- Batch size must be `1`.
- Record start time, end time, duration, GPU name, and peak VRAM if available.
- Stop if the command silently falls back to CPU.

## Cell 10: Output Preview And Download

Purpose:

- Preview generated output.
- Download only approved output artifacts.

Placeholder cell:

```python
# PLACEHOLDER ONLY.
#
# from IPython.display import display
# from PIL import Image
#
# display(Image.open(output_path))
#
# from google.colab import files
# files.download(str(output_path))
```

Download rules:

- Download generated output image only if the input assets are permitted.
- Download benchmark JSON and sanitized notes.
- Do not download accidental archives containing inputs, weights, or secrets.

## Cell 11: Benchmark Log Placeholder

Purpose:

- Write a lightweight benchmark JSON for the run.

Placeholder cell:

```python
import json
from datetime import datetime, timezone

benchmark = {
    "runId": "catvton-colab-smoke-001",
    "provider": "catvton",
    "modelName": "CatVTON",
    "modelRevision": "<verified-commit-sha>",
    "notebookPlatform": "colab",
    "gpuName": "<captured-gpu-name>",
    "cudaAvailable": True,
    "personInput": "<permitted-sample-id>",
    "garmentInput": "<permitted-sample-id>",
    "category": "upper_body",
    "seed": 42,
    "startedAt": "<captured-start-time>",
    "completedAt": datetime.now(timezone.utc).isoformat(),
    "durationMs": None,
    "peakMemoryMb": None,
    "status": "placeholder",
    "outputPath": "<output-path>",
    "error": None,
    "notes": "Replace with actual experiment notes.",
}

benchmark_path = BASE_DIR / "data" / "output" / "benchmark" / "catvton-colab-smoke-001.json"
benchmark_path.write_text(json.dumps(benchmark, indent=2), encoding="utf-8")
print("benchmark:", benchmark_path)
```

## Cell 12: Cleanup Cell

Purpose:

- Remove sensitive or large temporary files before ending the notebook session.

Placeholder cell:

```python
# PLACEHOLDER ONLY.
# Review paths before running cleanup.
#
# !rm -rf {BASE_DIR / "data" / "input"}
# !rm -rf {BASE_DIR / "models"}
# !rm -rf {BASE_DIR / "repos"}
```

Cleanup checklist:

- Input images removed.
- Model weights removed unless retention is explicitly approved.
- Temporary archives removed.
- Logs reviewed for secrets or private paths.
- Outputs reviewed before download.
- Runtime disconnected after the experiment.

## Cell 13: Experiment Log Update Checklist

After the notebook run, update `ml/EXPERIMENT_LOG.md` with:

- Experiment ID.
- Date.
- Platform.
- Model and revision.
- License status.
- Input sample set.
- GPU/runtime.
- Setup commands.
- Inference command.
- Runtime duration.
- Output quality notes.
- Failures.
- Cost.
- Decision: `continue`, `pause`, or `reject`.

Decision rules:

- Use `continue` only if the run is reproducible and permitted.
- Use `pause` if licensing, model access, preprocessing, or hardware remains
  unresolved.
- Use `reject` if licensing, privacy, reproducibility, or output quality blocks
  the candidate.

