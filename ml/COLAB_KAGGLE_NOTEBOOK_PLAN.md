# Velora Colab and Kaggle Notebook Experiment Plan

Version: 1.0  
Status: Planning Only  
Last Updated: 2026-07-09

## 1. Purpose

This document defines a notebook-based experiment workflow for testing
CatVTON-style virtual try-on models outside the main Velora application.

The notebook workflow is for isolated research only. It must not process real
Velora user images, production catalog data, private wardrobe images, or any
asset that does not have explicit permission for AI experimentation.

This plan does not create notebook files, install dependencies, download model
weights, or implement inference.

## 2. Experiment Boundary

Notebook experiments may be used to evaluate:

- Whether a CatVTON-style model can run in a managed GPU notebook environment.
- Required preprocessing for person, garment, and mask inputs.
- Runtime, VRAM usage, and failure modes.
- Output quality on synthetic or publicly permitted test samples.
- Whether the model is suitable for a later self-hosted prototype.

Notebook experiments must not be treated as production architecture. Any useful
result must later be reproduced in the local AI lab runner and then in a
self-hosted worker before product integration.

## 3. Colab Folder Structure

Use a temporary Colab workspace layout that mirrors the local `ml` structure
without committing notebook outputs back to the repository.

```text
/content/velora-ai-lab/
├── repos/
│   └── catvton/
├── models/
│   └── catvton/
├── data/
│   ├── input/
│   │   ├── persons/
│   │   ├── garments/
│   │   └── masks/
│   └── output/
│       ├── images/
│       └── benchmark/
├── logs/
└── reports/
```

Recommended Colab Drive layout, if Drive is used:

```text
MyDrive/velora-ai-lab/
├── inputs/
├── outputs/
├── logs/
└── reports/
```

Do not store model weights or private data in shared Drive folders.

## 4. Kaggle Folder Structure

Use Kaggle working directories for generated files and Kaggle input datasets
only for synthetic or explicitly permitted assets.

```text
/kaggle/working/velora-ai-lab/
├── repos/
│   └── catvton/
├── models/
│   └── catvton/
├── data/
│   ├── input/
│   │   ├── persons/
│   │   ├── garments/
│   │   └── masks/
│   └── output/
│       ├── images/
│       └── benchmark/
├── logs/
└── reports/
```

Kaggle input datasets should be read-only test fixtures. Generated outputs
should be written under `/kaggle/working` and downloaded or deleted before the
session ends.

## 5. Notebook Cell Order

Each experiment notebook should follow this order:

1. Environment and GPU check.
2. Runtime configuration.
3. Dependency installation.
4. Repository clone or source checkout placeholder.
5. Model weight download placeholder.
6. Input upload or mount.
7. Input validation and preview.
8. Preprocessing placeholder.
9. Sample inference placeholder.
10. Output inspection.
11. Benchmark logging.
12. Output download.
13. Privacy cleanup.

Cells should be rerunnable from a clean runtime. Avoid hidden state assumptions.

## 6. Setup Cells

### 6.1 Environment Check

The first cell should print environment details:

```python
import os
import platform
import sys

print("python:", sys.version)
print("platform:", platform.platform())
print("cwd:", os.getcwd())
```

### 6.2 GPU Check

The GPU cell should verify CUDA availability without failing the entire
notebook if GPU allocation is unavailable:

```python
!nvidia-smi || true

try:
    import torch

    print("torch:", torch.__version__)
    print("cuda_available:", torch.cuda.is_available())
    if torch.cuda.is_available():
        print("gpu:", torch.cuda.get_device_name(0))
        print("gpu_memory_allocated:", torch.cuda.memory_allocated(0))
except Exception as exc:
    print("torch_check_error:", repr(exc))
```

If no CUDA GPU is available, stop the model experiment and record the failed
environment assignment in the benchmark log.

### 6.3 Workspace Setup

The workspace setup cell should create folders explicitly:

```python
from pathlib import Path

BASE_DIR = Path("/content/velora-ai-lab")  # Colab
# BASE_DIR = Path("/kaggle/working/velora-ai-lab")  # Kaggle

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

print(BASE_DIR)
```

## 7. Dependency Installation Strategy

Dependency cells should be explicit, version-aware, and easy to disable.

Use this strategy:

- Start from the upstream model's documented install commands.
- Pin major dependencies after the first successful run.
- Avoid installing unrelated notebook convenience packages.
- Record exact package versions in the benchmark log.
- Restart the runtime only when required by dependency changes.

Placeholder:

```python
# Placeholder only. Replace with verified upstream installation steps.
# !pip install --upgrade pip
# !pip install torch torchvision --index-url <verified-cuda-index>
# !pip install -r {BASE_DIR / "repos" / "catvton" / "requirements.txt"}
```

Do not paste unverified install commands into a shared notebook. Confirm license
and security expectations before running third-party setup scripts.

## 8. Model Clone And Download Placeholders

Repository clone placeholder:

```python
# Placeholder only. Verify repository URL, license, revision, and security first.
# !git clone <verified-catvton-repo-url> {BASE_DIR / "repos" / "catvton"}
# %cd {BASE_DIR / "repos" / "catvton"}
# !git checkout <verified-commit-sha>
```

Model download placeholder:

```python
# Placeholder only. Verify model weight license and access rules first.
# MODEL_DIR = BASE_DIR / "models" / "catvton"
# !python scripts/download_weights.py --output {MODEL_DIR}
```

Before downloading any weight:

- Confirm the model license permits research use.
- Confirm the source is official or explicitly trusted.
- Record the model name, version, checksum if available, and download URL.
- Do not commit downloaded weights to Velora.

## 9. Input Upload Rules

Allowed inputs:

- Synthetic person/model images.
- Publicly permitted test images with clear usage rights.
- Synthetic garment images.
- Public-domain or explicitly licensed garment images.
- Manually created masks where licensing is clear.

Disallowed inputs:

- Real Velora user images.
- Private wardrobe images.
- Retailer product images without permission.
- Social media images.
- Celebrity or influencer images.
- Images containing minors.
- Images with unclear ownership or consent.

Colab upload placeholder:

```python
# from google.colab import files
# uploaded = files.upload()
# Save uploaded files into BASE_DIR / "data" / "input" / ...
```

Kaggle input rule:

- Prefer a private Kaggle dataset containing only permitted synthetic test
  assets.
- Do not publish datasets containing private or unclear assets.

## 10. Input Validation Cells

Before inference, each input should be validated and previewed:

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

Validation requirements:

- File exists.
- File is a supported image type.
- Dimensions are within the model's expected range.
- Image orientation is correct.
- Garment category is known.
- Mask input is present only if required by the selected model path.

## 11. Sample Inference Cell Outline

The sample inference cell should be a clear placeholder until the upstream
CatVTON command is verified:

```python
# Placeholder only. Replace with verified upstream inference command.
# request_id = "smoke-001"
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

The first notebook run should use one sample only. Batch execution is allowed
only after single-sample preprocessing, inference, output validation, and
cleanup are confirmed.

## 12. Output Download Rules

Outputs may include:

- Generated try-on image.
- Benchmark JSON.
- Environment log.
- Short Markdown notes.

Outputs must not include:

- Model weights.
- Private source images.
- Unredacted notebook credentials.
- User data.

Colab download placeholder:

```python
# from google.colab import files
# files.download(str(output_path))
```

Kaggle download rule:

- Use the Kaggle output panel or package selected output files into a small
  archive under `/kaggle/working`.
- Delete any disallowed or accidental files before saving outputs.

## 13. Benchmark Logging Rules

Every notebook experiment should write one JSON record per run.

Required fields:

- `runId`
- `provider`
- `modelName`
- `modelRevision`
- `notebookPlatform`
- `gpuName`
- `cudaAvailable`
- `pythonVersion`
- `torchVersion`
- `personInput`
- `garmentInput`
- `category`
- `seed`
- `startedAt`
- `completedAt`
- `durationMs`
- `peakMemoryMb` if available
- `status`
- `outputPath`
- `error`
- `notes`

Placeholder:

```python
import json
import time
from datetime import datetime, timezone

benchmark = {
    "runId": "catvton-smoke-001",
    "provider": "catvton",
    "modelName": "catvton",
    "modelRevision": "<verified-commit-or-version>",
    "notebookPlatform": "colab",
    "gpuName": "<captured-from-runtime>",
    "cudaAvailable": True,
    "pythonVersion": sys.version,
    "torchVersion": "<captured-if-installed>",
    "personInput": "<non-private-sample-id>",
    "garmentInput": "<non-private-sample-id>",
    "category": "upper_body",
    "seed": 42,
    "startedAt": datetime.now(timezone.utc).isoformat(),
    "completedAt": None,
    "durationMs": None,
    "peakMemoryMb": None,
    "status": "not_run",
    "outputPath": None,
    "error": None,
    "notes": "Placeholder record.",
}

benchmark_path = BASE_DIR / "data" / "output" / "benchmark" / "catvton-smoke-001.json"
benchmark_path.write_text(json.dumps(benchmark, indent=2), encoding="utf-8")
```

Notebook benchmark logs should later be copied into the local AI lab only if
they contain no private paths, credentials, or disallowed assets.

## 14. Privacy And Cleanup Checklist

Before running:

- Confirm every input asset is synthetic or explicitly permitted.
- Confirm no user data is mounted into the notebook.
- Confirm no API keys or secrets are printed in cells.
- Confirm the notebook is private.
- Confirm runtime sharing is disabled unless deliberately reviewed.

Before downloading outputs:

- Review generated images.
- Remove accidental uploads.
- Remove temporary archives containing inputs.
- Remove logs that contain private paths or credentials.
- Keep only approved output images and benchmark summaries.

Before ending the session:

```python
# Optional cleanup placeholder.
# !rm -rf {BASE_DIR / "data" / "input"}
# !rm -rf {BASE_DIR / "models"}
# !rm -rf {BASE_DIR / "repos"}
```

Do not rely on notebook runtime disposal as the only cleanup step.

## 15. Cost And Time Control Rules

Free notebook rules:

- Use free GPU sessions before paid providers.
- Stop if no GPU is assigned after a reasonable retry window.
- Do not leave idle runtimes connected.
- Record session start and stop times.

Paid notebook or rented GPU rules:

- Set a maximum budget before starting.
- Use one GPU only.
- Run one smoke sample before any batch.
- Stop the instance immediately after outputs are collected.
- Do not keep paid storage volumes unless there is a written reason.

Time limits:

- Environment setup target: 30 minutes.
- First model load target: 30 minutes.
- First inference target: 30 minutes after model load.
- Total first smoke session target: 2 hours.

Stop the experiment if setup exceeds the time limit without a clear fix.

## 16. Success Criteria

A notebook experiment is successful only if:

- The selected runtime provides a CUDA GPU.
- The model repository and weights are obtained from verified sources.
- One synthetic or permitted sample runs end to end.
- Output image and benchmark JSON are created.
- Runtime, VRAM, and failure notes are captured.
- Cleanup is completed.
- The result can be reproduced in a second clean notebook session.

A successful notebook run does not approve production use. It only allows
planning the next local AI lab or self-hosted worker prototype step.

## 17. Known Limitations

- Notebook runtimes are temporary and may assign different GPUs.
- Free GPU availability is not guaranteed.
- Installed package versions may drift unless pinned.
- Cloud notebook paths differ from the Velora local AI lab.
- Output quality from one or two samples is not enough for model selection.
- Privacy controls depend on disciplined manual review.
- CatVTON-style model licenses and weight access must be verified before every
  implementation decision.

