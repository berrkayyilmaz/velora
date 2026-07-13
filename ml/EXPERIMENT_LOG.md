# Velora AI Experiment Log Template

Version: 1.0  
Status: Template Only  
Last Updated: 2026-07-09

## 1. Purpose

This document defines a repeatable log format for local and cloud AI
experiments related to virtual try-on research.

Use one completed log entry per experiment run. Do not include private user
images, copyrighted retailer assets, production secrets, model weights, or
generated images directly in this file.

## 2. Completed Experiments

### 2.1 catvton-colab-smoke-001

```text
Experiment ID: catvton-colab-smoke-001
Date: 2026-07-13
Owner: Velora research

Platform:
  Provider: Google Colab
  Environment: GPU notebook
  Region: Managed by provider
  Notebook or runner: Research-only CatVTON direct inference script

Model:
  Name: CatVTON
  Version or commit: Unverified in repo
  Source URL: https://github.com/Zheng-Chong/CatVTON
  Weights source: zhengchong/CatVTON via Hugging Face download path
  Model card: Unverified in repo

License Status:
  Status: research-only
  License type: CC BY-NC-SA 4.0 observed in public CatVTON materials
  Commercial use allowed: no under public noncommercial license
  Review link or notes: See ml/MODEL_LICENSE_GATE.md

Input Sample Set:
  Manifest: Not used
  Person samples: /content/velora-ai-lab/data/input/persons/sample_person.png
  Garment samples: /content/velora-ai-lab/data/input/garments/sample_garment.png
  Mask samples: None provided
  Cloth type: upper
  Asset permission notes: Research-only sample assets; no Velora user images
  Excluded assets: User wardrobe images, retailer images, social media images

GPU and Runtime:
  GPU: NVIDIA Tesla T4
  VRAM: 15 GB class
  CPU: Managed by Google Colab
  RAM: Managed by Google Colab
  OS: Managed by Google Colab
  Python version: 3.12.13
  CUDA version: 12.1
  PyTorch version: 2.4.0
  Torchvision version: 0.19.0
  Diffusers version: 0.30.3
  Accelerate version: 0.34.2
  Transformers version: 4.46.3
  Gradio version: 4.41.0
  fvcore version: 0.1.5.post20221221
  opencv-python version: 4.10.0.84
  huggingface-hub version: 0.36.2
  Precision: fp16

Setup Commands:
  Commands: See ml/README.md research-only CatVTON direct inference command
  Dependency notes: Verified imports in Colab before execution
  Install duration: Not recorded
  Setup issues: Unauthenticated Hugging Face downloads were used

Inference Command:
  Command: python -m src.providers.catvton_research with Colab PYTHONPATH
  Batch size: 1
  Image size: 768x1024
  Resolution: 768x1024
  Seed: 42
  Inference steps: 30
  Guidance scale: 2.5
  Preprocessing: automatic mask generated and blurred
  mask_generated: true
  Output directory: /content/velora-ai-lab/data/output/images

Runtime Duration:
  Started at: Not recorded
  Completed at: Not recorded
  Setup duration: Not recorded
  Model load duration: Not recorded separately
  Inference duration: Approximately 57 seconds
  Total duration: Approximately 57 seconds for the smoke request after setup

Benchmark Metrics:
  Sample count: 1
  Success count: 1
  Failure count: 0
  Average duration: Approximately 57 seconds
  Peak VRAM: Not recorded
  Output paths: /content/velora-ai-lab/data/output/images/catvton-smoke-001.png
  Benchmark JSON path: Not recorded

Output Quality Notes:
  Result: success
  Clothing preservation: Not formally scored
  Body/pose consistency: Not formally scored
  Artifacts: Not formally scored
  Background handling: Not formally scored
  Face/identity handling: Not formally scored
  Failure examples: None for this smoke request
  Reviewer notes: Smoke test confirmed one generated output path

Failures:
  Error messages: None for final smoke run
  Failed samples: None
  Root cause: Not applicable
  Fix attempted: Runtime symbol loading was corrected separately in local code
  Follow-up needed: Move the direct path behind the approved provider adapter boundary

Cost:
  Free or paid: Free
  Provider rate: 0
  Runtime hours: Not recorded
  Storage cost: 0
  Estimated total: 0
  Cost-control notes: Stop Colab runtime after smoke test

Privacy and Cleanup:
  User images used: no
  Private assets used: no
  Inputs deleted: Not recorded
  Outputs deleted or retained: Not recorded
  Model weights deleted or retained: Not recorded
  Logs reviewed for secrets: Not recorded

Warnings and Notes:
  Hugging Face downloads: unauthenticated downloads were used
  Unsafe .bin fallback: observed fallback should be treated as research-only
    and reviewed before any repeated or automated runs
  Licensing: public CatVTON materials remain noncommercial; product use is not
    approved

Decision:
  continue

Decision Rationale:
  Summary: Single CatVTON research smoke request completed successfully on
    Google Colab with NVIDIA Tesla T4.
  Next step: Continue to adapter integration in the isolated ML workspace.
  Blockers: License approval, authenticated model access, checkpoint handling,
    output quality review, privacy controls, and production GPU strategy remain
    unresolved for product use.
```

## 3. Experiment Entry Template

```text
Experiment ID:
Date:
Owner:

Platform:
  Provider:
  Environment:
  Region:
  Notebook or runner:

Model:
  Name:
  Version or commit:
  Source URL:
  Weights source:
  Model card:

License Status:
  Status: approved | research-only | rejected
  License type:
  Commercial use allowed:
  Review link or notes:

Input Sample Set:
  Manifest:
  Person samples:
  Garment samples:
  Mask samples:
  Asset permission notes:
  Excluded assets:

GPU and Runtime:
  GPU:
  VRAM:
  CPU:
  RAM:
  OS:
  Python version:
  CUDA version:
  PyTorch version:
  Precision:

Setup Commands:
  Commands:
  Dependency notes:
  Install duration:
  Setup issues:

Inference Command:
  Command:
  Batch size:
  Image size:
  Seed:
  Preprocessing:
  Output directory:

Runtime Duration:
  Started at:
  Completed at:
  Setup duration:
  Model load duration:
  Inference duration:
  Total duration:

Benchmark Metrics:
  Sample count:
  Success count:
  Failure count:
  Average duration:
  Peak VRAM:
  Output paths:
  Benchmark JSON path:

Output Quality Notes:
  Clothing preservation:
  Body/pose consistency:
  Artifacts:
  Background handling:
  Face/identity handling:
  Failure examples:
  Reviewer notes:

Failures:
  Error messages:
  Failed samples:
  Root cause:
  Fix attempted:
  Follow-up needed:

Cost:
  Free or paid:
  Provider rate:
  Runtime hours:
  Storage cost:
  Estimated total:
  Cost-control notes:

Privacy and Cleanup:
  User images used: no
  Private assets used: no
  Inputs deleted:
  Outputs deleted or retained:
  Model weights deleted or retained:
  Logs reviewed for secrets:

Decision:
  continue | pause | reject

Decision Rationale:
  Summary:
  Next step:
  Blockers:
```

## 4. Example Entry Skeleton

```text
Experiment ID: catvton-colab-smoke-001
Date: YYYY-MM-DD
Owner:

Platform:
  Provider: Google Colab
  Environment: Free GPU notebook
  Region: Managed by provider
  Notebook or runner: Notebook placeholder

Model:
  Name: CatVTON
  Version or commit: TBD
  Source URL: https://github.com/Zheng-Chong/CatVTON
  Weights source: TBD
  Model card: TBD

License Status:
  Status: research-only
  License type: CC BY-NC-SA 4.0 observed; confirm before use
  Commercial use allowed: no under public noncommercial license
  Review link or notes: See ml/MODEL_LICENSE_GATE.md

Input Sample Set:
  Manifest: TBD
  Person samples: synthetic/permitted only
  Garment samples: synthetic/permitted only
  Mask samples: TBD
  Asset permission notes: No real user or retailer assets
  Excluded assets: User wardrobe images, retailer images, social media images

GPU and Runtime:
  GPU: TBD
  VRAM: TBD
  CPU: TBD
  RAM: TBD
  OS: TBD
  Python version: TBD
  CUDA version: TBD
  PyTorch version: TBD
  Precision: TBD

Setup Commands:
  Commands: TBD
  Dependency notes: TBD
  Install duration: TBD
  Setup issues: TBD

Inference Command:
  Command: TBD
  Batch size: 1
  Image size: TBD
  Seed: 42
  Preprocessing: TBD
  Output directory: TBD

Runtime Duration:
  Started at: TBD
  Completed at: TBD
  Setup duration: TBD
  Model load duration: TBD
  Inference duration: TBD
  Total duration: TBD

Benchmark Metrics:
  Sample count: 1
  Success count: TBD
  Failure count: TBD
  Average duration: TBD
  Peak VRAM: TBD
  Output paths: TBD
  Benchmark JSON path: TBD

Output Quality Notes:
  Clothing preservation: TBD
  Body/pose consistency: TBD
  Artifacts: TBD
  Background handling: TBD
  Face/identity handling: TBD
  Failure examples: TBD
  Reviewer notes: TBD

Failures:
  Error messages: TBD
  Failed samples: TBD
  Root cause: TBD
  Fix attempted: TBD
  Follow-up needed: TBD

Cost:
  Free or paid: Free
  Provider rate: 0
  Runtime hours: TBD
  Storage cost: 0
  Estimated total: 0
  Cost-control notes: Stop runtime after smoke test

Privacy and Cleanup:
  User images used: no
  Private assets used: no
  Inputs deleted: TBD
  Outputs deleted or retained: TBD
  Model weights deleted or retained: TBD
  Logs reviewed for secrets: TBD

Decision:
  pause

Decision Rationale:
  Summary: Template entry only.
  Next step: Fill after actual experiment.
  Blockers: License, weights, and input preprocessing must be verified.
```

## 5. Logging Rules

- Create a new entry for every local, Colab, Kaggle, or paid GPU run.
- Use stable experiment IDs such as `catvton-colab-smoke-001`.
- Store raw benchmark JSON under ignored output folders.
- Keep this log textual and lightweight.
- Link to output paths instead of embedding generated images.
- Do not include credentials, access tokens, private paths, or user data.
- Mark the decision as `reject` if licensing, privacy, or reproducibility fails.
- Mark the decision as `pause` when the next step requires license, legal,
  hardware, or model access approval.
- Mark the decision as `continue` only when the result is reproducible and the
  next experiment is clearly permitted.
