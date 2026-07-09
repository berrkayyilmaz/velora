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

## 2. Experiment Entry Template

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

## 3. Example Entry Skeleton

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

## 4. Logging Rules

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

