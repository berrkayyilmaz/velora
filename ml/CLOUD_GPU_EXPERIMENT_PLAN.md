# Velora Cloud GPU Experiment Plan

Version: 1.0  
Status: Planning Only  
Last Updated: 2026-07-02

## 1. Purpose

This document defines a cost-controlled cloud GPU strategy for evaluating a
CatVTON-like virtual try-on model when the local machine has no NVIDIA GPU.

The plan is limited to research using synthetic or explicitly permitted test
assets. It does not approve production use, user-image processing, model
integration, or commercial use of CatVTON artifacts.

## 2. Decision Summary

Use this sequence:

1. Google Colab free GPU for the first environment and one-sample feasibility
   check.
2. Kaggle Notebooks as a second free environment when Colab capacity,
   compatibility, or session limits block progress.
3. Runpod or Vast.ai for short, capped, single-GPU paid experiments.
4. Lambda Cloud only when lower-cost inventory is unavailable or a more
   predictable managed instance is required.

Do not rent paid GPU capacity until the license, model revision, checkpoint,
input contract, and synthetic smoke sample are prepared locally.

## 3. Why Local Inference Is Not Suitable

The local machine is assumed to have no NVIDIA CUDA GPU. CPU execution is not a
valid path for virtual try-on evaluation because:

- Diffusion inference may be extremely slow or unsupported on CPU.
- CPU results cannot establish GPU latency, throughput, VRAM, precision, or
  production-cost expectations.
- The upstream model and preprocessing stack may depend on CUDA-specific
  PyTorch behavior.
- A local CPU run can verify configuration, manifests, file handling, and
  imports, but not model feasibility.

The existing Velora `devices` command should record the local baseline:

```powershell
cd ml
uv run python -m src.main devices
```

A `torch_not_installed` or CPU result is expected locally and is not an error
for the current no-inference workspace.

## 4. Minimum GPU Requirements

The official CatVTON repository reports less than 8 GB VRAM for 1024x768
inference. Velora should use more conservative cloud requirements because that
claim may not include every preprocessing step, dependency, allocation peak,
or notebook process.

| Resource | Minimum Experiment Target | Preferred |
| --- | --- | --- |
| GPU | NVIDIA CUDA GPU with 12 GB VRAM | 16-24 GB VRAM |
| System RAM | 16 GB | 32 GB |
| Free workspace storage | 40 GB | 80-100 GB |
| Batch size | 1 | 1 |
| GPU count | 1 | 1 |
| Operating system | Managed Linux notebook | Ubuntu Linux |

Hardware acceptance checks:

- `nvidia-smi` identifies the assigned GPU and available VRAM.
- PyTorch reports `torch.cuda.is_available() == True`.
- A small CUDA tensor operation succeeds.
- The selected model precision is supported by the assigned GPU.
- The model does not silently fall back to CPU.
- Peak VRAM is measured during model load, preprocessing, and inference.

Do not assume BF16 support. Free notebook services may assign hardware that
supports FP16 but not BF16. Precision changes must be explicitly supported by
the pinned upstream revision and recorded in the run manifest.

## 5. Free Experiment Options

### 5.1 Google Colab

Use Colab first because it provides a hosted notebook with optional free GPU
access and requires no local CUDA setup.

Operational constraints:

- GPU type and availability are not guaranteed.
- Free usage limits, idle timeouts, and maximum runtime vary.
- A paid Colab plan still does not guarantee a specific GPU.
- The assigned GPU must be inspected at the start of every session.
- The runtime may disappear, so all reproducibility records must be downloaded
  before disconnecting.

Colab is suitable for:

- Environment compatibility checks
- One synthetic input pair
- One checkpoint and one seed
- Batch size one
- Short smoke and repeatability runs

Colab is not suitable for:

- Private user media
- Unattended long-running benchmarks
- Guaranteed hardware comparisons
- Persistent model or dataset storage
- Production cost conclusions

### 5.2 Kaggle Notebooks

Use Kaggle as the second free option when:

- Colab does not allocate a usable GPU.
- Colab disconnects before the smoke run completes.
- A second clean notebook environment is needed to test reproducibility.

Before each Kaggle run:

- Confirm the current GPU accelerator option and quota in the notebook UI.
- Record the actual GPU model, VRAM, CUDA, and PyTorch versions.
- Confirm internet access and package installation rules for the session.
- Keep the notebook private.
- Use the same pinned source, checkpoint, inputs, seed, and output resolution
  used in Colab.

Do not hard-code a Kaggle GPU type or weekly quota in the experiment plan.
Availability and limits can change.

### 5.3 Free-Tier Exit Conditions

Move to a paid provider only when one of these conditions repeats:

- No 12 GB or larger compatible GPU is allocated.
- Sessions end before model download, load, and one inference complete.
- Required packages cannot be installed reproducibly.
- Persistent storage or SSH access is required for debugging.
- Hardware variation prevents meaningful comparison.

Free-tier inconvenience alone is not a reason to rent a high-end GPU.

## 6. Low-Cost Paid Options

Prices and inventory are volatile. Verify the final GPU, VRAM, storage,
bandwidth, region, reliability, and total hourly price in the provider console
immediately before launch.

### 6.1 Runpod

Preferred first paid option for a short controlled experiment.

Selection guidance:

- Start with one 16 GB or 24 GB GPU.
- Prefer RTX A5000, L4, RTX 3090, RTX 4090, or an equivalent available GPU.
- Use an on-demand Pod for the first reproducible run.
- Use temporary container storage unless a persistent volume is justified.
- Delete the Pod and unused storage immediately after artifacts are exported.

Runpod documents per-second Pod billing. Storage may continue to incur charges
depending on storage type, so stopping compute is not sufficient cost cleanup.

### 6.2 Vast.ai

Use Vast.ai when its marketplace has a materially cheaper suitable 16-24 GB
offer.

Selection guidance:

- Filter for one GPU, sufficient VRAM, compatible CUDA, and a high reliability
  score.
- Use on-demand for the first run; do not use interruptible capacity until the
  workflow can resume safely.
- Review compute, storage, and bandwidth charges separately.
- Treat community-hosted capacity as a higher security and reproducibility
  risk than a managed datacenter.
- Delete the instance completely when finished because stopped instances can
  continue to incur storage charges.

Vast.ai pricing is market-driven and changes with host, region, reliability,
storage, bandwidth, and demand.

### 6.3 Lambda Cloud

Use Lambda Cloud only when lower-cost inventory is unsuitable or a managed
GPU environment is worth the higher hourly cost.

Selection guidance:

- Choose the lowest-cost single GPU with at least 16 GB VRAM.
- Prefer a 24 GB class instance before considering A100 or H100 hardware.
- Terminate the instance immediately after outputs and logs are exported.
- Verify current per-minute compute and persistent filesystem billing.

### 6.4 Hardware Escalation

Do not begin with A100, H100, or multi-GPU instances.

Escalate from 16-24 GB only when a measured, reproducible out-of-memory failure
occurs and lower-cost mitigations are invalid for the pinned model. Record the
failed run before changing GPU type, resolution, precision, or preprocessing.

## 7. Data Transfer Rules

Only transfer the minimum files required for the current experiment:

- Pinned source archive or exact Git revision
- Reviewed dependency lock or install record
- Approved checkpoint files with hashes
- One small synthetic smoke sample initially
- Versioned manifest and non-sensitive run configuration

Rules:

- Do not upload the Velora repository, `.env` files, credentials, API keys, or
  application databases.
- Do not upload model weights to public notebook outputs or public datasets.
- Download checkpoints directly from the approved source into the ephemeral
  runtime when terms permit.
- Verify checkpoint and input hashes after transfer.
- Remove EXIF and unnecessary metadata from images before upload.
- Use generated IDs instead of names in paths and logs.
- Keep notebooks private and disable public sharing.
- Export only the run manifest, metrics, approved generated output, and
  dependency record.
- Delete cloud-side inputs, outputs, caches, notebooks, and volumes after the
  experiment and verify deletion where the provider supports it.

Do not use a personal Google Drive, public Kaggle Dataset, public object-storage
bucket, or public model repository to move private experiment media.

## 8. Privacy Rules

Free notebook services are approved only for synthetic, public-domain, or
explicitly licensed non-user fixtures.

The following are prohibited:

- Velora user or closed-beta images
- Team-member images
- Retailer images without explicit transformation rights
- Social-media or search-result images
- Public-figure images
- Names, emails, account IDs, precise locations, EXIF, or biometric templates
- Data whose consent, license, or retention terms are unresolved

Before any future real-person cloud test:

- Complete provider security, subprocessors, region, retention, deletion, and
  contractual review.
- Obtain explicit experiment-specific consent.
- Use encrypted private transfer and storage.
- Define who can access source and generated media.
- Define and execute a short deletion deadline.
- Prevent provider use of data for training or service improvement where
  contractually possible.

A successful synthetic experiment does not approve real-user processing.

## 9. Experiment Workflow

### Stage 0: Approval Gate

1. Pin the CatVTON source revision.
2. Review code, checkpoint, base-model, preprocessor, and dataset licenses.
3. Confirm the experiment is permitted under the non-commercial restrictions.
4. Record checkpoint source, size, and checksum.
5. Prepare one synthetic upper-body person and garment pair.
6. Freeze seed, resolution, category, precision, and expected command.

Stop if any license or artifact source is unresolved.

### Stage 1: Notebook Environment Check

1. Start Colab with a GPU accelerator.
2. Record GPU, VRAM, driver, CUDA, Python, and PyTorch versions.
3. Run a small CUDA tensor check.
4. Confirm available disk and system RAM.
5. End the session if the GPU has insufficient VRAM or unsupported precision.

Repeat in Kaggle only if Colab is unavailable or unsuitable.

### Stage 2: Reproducible Setup

1. Fetch the pinned source revision.
2. Install only the reviewed dependencies.
3. Download approved weights into ephemeral storage.
4. Verify all hashes.
5. Disable or record automatic transitive downloads.
6. Save the resolved dependency and environment record.

### Stage 3: Single-Sample Smoke Run

1. Use batch size one and one deterministic seed.
2. Run preprocessing separately where practical.
3. Run one inference.
4. Verify the output decodes at the expected dimensions.
5. Record cold load, preprocessing, inference, total duration, peak VRAM, and
   system RAM.
6. Record warnings, failures, and exact command arguments.

### Stage 4: Repeatability

1. Restart the runtime.
2. Reproduce the same environment and artifacts from the recorded inputs.
3. Run the same sample and seed.
4. Compare hashes and visible output differences.
5. Record all nondeterministic behavior.

### Stage 5: Small Benchmark

Only after the smoke run succeeds:

1. Run the 6-12 sample synthetic smoke split.
2. Keep batch size one.
3. Preserve failed samples.
4. Generate the benchmark summary and Markdown report.
5. Review garment fidelity, person preservation, boundaries, background, and
   safety.

### Stage 6: Paid Escalation

1. Select the lowest-cost suitable 16-24 GB GPU.
2. Set the spend cap before launch.
3. Reproduce the free-tier smoke run unchanged.
4. Run the small benchmark only after reproduction succeeds.
5. Export approved evidence.
6. Terminate compute and delete storage.
7. Reconcile the actual charge against the planned budget.

## 10. Success Criteria

The experiment succeeds only when:

- The exact source and checkpoint revisions are recorded and hash-verified.
- License review permits the experiment.
- A CUDA GPU is detected and CPU fallback is disabled.
- One 1024x768 or explicitly approved baseline sample completes at batch size
  one without out-of-memory failure.
- The complete run reproduces from a clean session.
- Output dimensions and files are valid.
- Cold load, preprocessing, inference, total duration, and peak VRAM are
  recorded.
- The 6-12 sample smoke split completes with every failure retained.
- Generated outputs are manually reviewed against the fixed quality checklist.
- No prohibited or private data is transferred.
- Cloud inputs, outputs, caches, and paid storage are deleted after export.
- Actual cost remains within the approved cap.

This is a research feasibility gate, not a production-quality or commercial
license approval.

## 11. Cost-Control Rules

- Use free Colab and Kaggle attempts before paid compute.
- Set an initial paid experiment cap of USD 10.
- Require explicit review before total research spend exceeds USD 25.
- Use one GPU and batch size one.
- Start with 16-24 GB VRAM; do not rent premium training GPUs by default.
- Use on-demand capacity for the first reproducible run.
- Use interruptible capacity only after checkpointing and resume behavior work.
- Disable automatic credit top-up where the provider permits.
- Set provider spend alerts or low prepaid balances.
- Prepare scripts, hashes, inputs, and commands before launching the GPU.
- Measure setup time separately and stop the GPU during extended debugging
  when storage behavior is understood.
- Terminate instances instead of leaving them idle.
- Delete persistent disks, volumes, snapshots, and unused notebook artifacts.
- Verify storage and bandwidth charges, not only GPU hourly price.
- Record planned rate, runtime, storage, transfer, tax, and final actual cost.

## 12. Risks And Stop Conditions

Stop the experiment when:

- License terms do not permit the intended evaluation.
- The provider cannot meet privacy or deletion requirements.
- The assigned GPU silently falls back to CPU.
- Checkpoint hashes do not match.
- Unexpected model or dependency downloads occur.
- Private or unapproved media is discovered.
- The same environment cannot be reproduced.
- Spend approaches the approved cap without a successful smoke run.
- Outputs introduce severe unsafe exposure or anatomical distortion.

Do not solve a failed feasibility run by increasing spend without first
identifying the measured blocker.

## 13. Sources

Sources were reviewed on 2026-07-02. Pricing and free-tier capacity must be
rechecked at experiment time.

- [CatVTON official repository](https://github.com/Zheng-Chong/CatVTON)
- [Google Colab FAQ](https://research.google.com/colaboratory/faq.html)
- [Kaggle Notebooks](https://www.kaggle.com/code)
- [Runpod Pod pricing documentation](https://docs.runpod.io/pods/pricing)
- [Runpod GPU types](https://docs.runpod.io/references/gpu-types)
- [Vast.ai pricing documentation](https://docs.vast.ai/guides/instances/pricing)
- [Vast.ai billing documentation](https://docs.vast.ai/guides/reference/billing)
- [Lambda Cloud billing documentation](https://docs.lambda.ai/public-cloud/billing/)
- [Lambda GPU instances](https://lambda.ai/instances)
- [Velora CatVTON Research Notes](./CATVTON_RESEARCH.md)
- [Velora AI Lab Setup](../docs/AI_LAB_SETUP.md)

This plan is technical guidance, not legal or privacy advice.
