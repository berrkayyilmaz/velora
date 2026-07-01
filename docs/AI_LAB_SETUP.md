# Velora Local AI Lab Setup

Version: 1.0  
Status: Planning Draft  
Phase: Future Phase 3 - Local Prototype  
Last Updated: 2026-07-01

## 1. Purpose

The Velora AI lab is an isolated environment for evaluating self-hosted virtual try-on
models before any integration with the main application.

The first candidate is CatVTON. The same lab conventions should support comparison with
other CatVTON-like models through separate, pinned environments.

The lab exists to answer:

- Can the model run reproducibly on available hardware?
- What image conditions produce acceptable or unacceptable results?
- What are latency, peak VRAM, disk, and dependency requirements?
- How consistent is garment detail and body preservation?
- What safety, privacy, licensing, and quality risks block further rollout?

The lab is not a user-facing service. It must not call Velora APIs, access the application
database, consume production media, or write files into runtime application directories.

## 2. Lab Boundary

Use a separate working directory outside the Velora repository, such as:

```text
velora-ai-lab/
|-- models/          # Pinned upstream checkouts; one directory per candidate
|-- environments/    # Environment lock files and setup records
|-- inputs/          # Approved local test inputs
|-- masks/           # Generated or reviewed masks
|-- runs/            # Run manifests, logs, and generated outputs
|-- benchmarks/      # Aggregated, non-identifying measurements
`-- licenses/        # License and dependency inventory snapshots
```

This structure is a planning convention only; it is not created by this document.

Rules:

- Do not place model checkpoints, datasets, person images, or outputs in the Velora repo.
- Do not commit lab media, weights, credentials, signed URLs, or environment caches.
- Pin every model checkout to an exact commit before recording benchmark results.
- Use one Python environment per model candidate.
- Treat downloaded code, weights, base models, and datasets as separate licensed artifacts.
- Keep the lab offline from Velora services unless a later architecture review approves an
  explicit integration.

## 3. Hardware Requirements

### 3.1 Prototype Workstation

| Resource | Minimum For Initial Check | Recommended For Repeatable Testing |
| --- | --- | --- |
| GPU | NVIDIA CUDA-capable GPU with 8 GB VRAM | NVIDIA GPU with 16 GB VRAM |
| System RAM | 16 GB | 32 GB or more |
| CPU | 4 modern cores | 8 or more modern cores |
| Free SSD space | 40 GB | 100 GB or more |
| Operating system | Linux or Windows with WSL2 | Ubuntu Linux LTS |
| Internet | Required for approved dependencies and weights | Same, followed by cached/pinned artifacts |

The CatVTON repository reports approximately 8 GB VRAM for 1024x768 inference with BF16.
That figure is a model-specific reference, not a full workstation guarantee. Velora should
prefer 16 GB VRAM to cover preprocessing, model loading, driver overhead, experiments, and
out-of-memory diagnostics.

An 8 GB GPU may be used only for a basic feasibility run with:

- Batch size of one
- Mixed precision
- One inference process
- No other GPU workloads
- Reduced resolution if the pinned model supports it

CPU-only execution is not an acceptance path. It may be used only to verify imports or
inspect preprocessing behavior.

### 3.2 GPU Baseline Record

Each workstation must record:

- GPU model and VRAM
- NVIDIA driver version
- Reported CUDA runtime
- Operating system and kernel
- CPU and system RAM
- Available disk space
- PyTorch version
- Whether BF16, FP16, and TF32 are supported

This baseline belongs in each experiment manifest so results from different machines are
not compared as if they used identical conditions.

## 4. Python And CUDA Environment

### 4.1 Host Recommendation

Use native Linux where available. On Windows, use WSL2 with NVIDIA GPU support rather than
building the initial lab directly in Windows. The upstream CatVTON documentation identifies
Windows-specific setup issues, while its published commands assume a Unix-like environment.

### 4.2 Environment Strategy

For each model:

1. Create a dedicated Conda or Micromamba environment.
2. Use the Python version documented by the pinned upstream revision.
3. Install the PyTorch build compatible with the installed NVIDIA driver.
4. Install the model's remaining dependencies from the pinned revision.
5. Replace moving Git dependencies with an exact commit in the lab lock record.
6. Export a reproducible environment lock after the first successful run.
7. Record hashes for downloaded checkpoints and important model artifacts.

The current CatVTON repository documents Python 3.9 and pins PyTorch 2.4.0 and torchvision
0.19.0, while referencing Diffusers from Git. The lab must capture the exact Diffusers
commit rather than allowing later installs to resolve to a different revision.

Do not install experimental AI dependencies into the backend, frontend, admin, or root
workspace package environments.

### 4.3 CUDA Assumptions

- Use an NVIDIA driver compatible with the selected PyTorch binary.
- Prefer the CUDA runtime bundled with the PyTorch distribution.
- Install a separate CUDA toolkit only when an upstream dependency must compile extensions.
- Verify GPU access before downloading datasets or starting a benchmark.
- Do not mix multiple CUDA toolkit paths in one environment.
- Record compiler and CUDA toolkit versions when native extensions are built.
- Disable automatic package upgrades after the environment is validated.

The setup is considered valid only when:

- The GPU is visible to the Linux or WSL2 environment.
- PyTorch reports CUDA availability.
- A small tensor operation completes on the selected GPU.
- The model loads without CPU fallback.
- A single approved sample completes and produces a decodable image.

## 5. Model And Artifact Governance

CatVTON must be treated as a research prototype candidate. Its official repository licenses
the code, checkpoints, and demo under CC BY-NC-SA 4.0, which limits use to non-commercial
purposes under the stated terms.

Before any experiment:

- Record the repository URL and exact commit.
- Save the repository license text and retrieval date.
- Record every checkpoint URL and checksum.
- Identify base-model, preprocessing-model, and dataset licenses.
- Record whether an account or separate terms were required to download an artifact.
- Do not redistribute checkpoints or datasets through Velora storage.
- Stop evaluation if the intended use is unclear under an artifact's terms.

Local technical evaluation does not establish commercial production rights. Legal approval
is required before closed-beta or production use.

## 6. Input And Dataset Rules

### 6.1 Permitted Inputs

Use only:

- Synthetic person images created for testing
- Team-owned images with documented, explicit test consent
- Garment images created by Velora or covered by documented test rights
- Properly licensed research datasets used strictly within their terms

Do not use:

- Production or closed-beta user media
- Images scraped from retailer, social, or search websites
- Images of minors
- Images supplied by a person who did not explicitly consent
- Public figures or third parties used without authorization
- Nude, sexual, exploitative, or otherwise unsafe imagery
- Images retained from unrelated product testing

### 6.2 Person Image Guidance

Initial benchmark person images should:

- Contain one consenting adult
- Be front-facing with a neutral or simple pose
- Show the relevant upper-body region without severe cropping
- Use even lighting and a plain or low-complexity background
- Avoid occlusion from crossed arms, bags, coats, or other people
- Use opaque, non-sensitive clothing
- Be sharp enough for the required output resolution
- Be normalized to sRGB and have metadata removed

The benchmark should still include controlled challenging cases such as varied body shapes,
skin tones, backgrounds, poses, hair occlusion, and lighting. These cases must be labeled as
test dimensions, not sensitive user attributes attached to identities.

### 6.3 Garment Image Guidance

Initial garment images should:

- Be limited to supported upper-body categories
- Show one garment clearly
- Use a front-facing product view
- Avoid severe folds, occlusion, mannequins, or multiple garments
- Preserve enough resolution to inspect texture, logos, and patterns
- Have documented usage rights

### 6.4 File Rules

- Accept JPEG or PNG for the initial lab.
- Decode and re-encode inputs before use.
- Strip EXIF and other embedded metadata.
- Reject corrupted, animated, or unexpectedly large files.
- Use generated experiment IDs rather than names, emails, or source filenames.
- Store input hashes in manifests to detect accidental duplication.
- Keep original approved inputs read-only during an experiment.

### 6.5 Masks And Preprocessing

The CatVTON paper simplifies model conditioning, but the official demo uses DensePose and
SCHP to generate masks automatically. The lab must therefore treat mask quality as a
measured pipeline dependency.

For each run, record:

- Whether the mask was supplied or generated
- Preprocessor name, version, and checksum
- Mask-generation parameters
- Whether a human reviewed or corrected the mask
- Visible mask defects

Do not silently hand-correct masks in benchmark runs. Corrected masks must be stored as a
separate experiment variant.

## 7. Local Test Workflow

### 7.1 Preparation

1. Approve the model revision, license inventory, and input set.
2. Record the workstation baseline.
3. Create the isolated Python environment.
4. Download artifacts into the external lab directory.
5. Verify checksums and GPU availability.
6. Assign non-identifying IDs to person and garment inputs.

### 7.2 Smoke Test

Run one upper-body pair with:

- Batch size one
- A fixed seed
- The upstream-recommended resolution
- The upstream-recommended mixed precision for the GPU
- Default inference parameters

Confirm:

- Model load succeeds.
- Peak VRAM remains within safe headroom.
- Inference completes without CPU fallback.
- Output is decodable and has expected dimensions.
- Temporary files remain inside the run directory.
- The run manifest contains enough information to reproduce the result.

### 7.3 Benchmark Matrix

After the smoke test, use a fixed matrix covering:

- At least three person body presentations
- Multiple skin tones
- Simple and complex backgrounds
- Straight and mildly occluded poses
- Solid, patterned, textured, and logo-bearing garments
- Light and dark garments
- Paired and deliberately mismatched garment/person combinations
- Automatic-mask and reviewed-mask variants
- At least three fixed seeds for selected difficult pairs

The benchmark set must be small enough for manual review but stable across model candidates.
Do not add test images after seeing results without versioning the benchmark set.

### 7.4 Measurements

Record per run:

- Model, commit, checkpoint, and preprocessing versions
- Person, garment, and mask input hashes
- Seed and inference parameters
- Input and output resolution
- Precision mode
- Load time and inference time
- Peak allocated and reserved VRAM
- Success or structured failure reason
- Garment-detail preservation
- Body, face, hand, and background preservation
- Boundary and occlusion artifacts
- Safety rejection outcome

Automated image metrics may supplement review but must not replace human inspection.

### 7.5 Comparison Rules

- Compare models on the same input set, resolution, and review rubric.
- Separate model load time from warm inference time.
- Run at least one cold start and multiple warm runs.
- Do not compare results produced with different manually corrected masks as equivalent.
- Keep failed outputs and reasons in aggregate statistics.
- Blind the model name during subjective review when practical.
- Record quality regressions as well as visually strong examples.

## 8. Output Handling

Each run should have an immutable experiment directory containing:

```text
runs/<experiment-id>/
|-- manifest.json
|-- logs/
|-- masks/
|-- outputs/
`-- review/
```

The manifest should contain configuration and hashes, not names or personal information.

Output rules:

- Generated images are private research artifacts.
- Do not upload outputs to public demos, issue trackers, chat tools, or shared drives.
- Do not use outputs in marketing, product listings, or user research without separate
  approval and consent.
- Label every displayed output as AI-generated and not a fit or size prediction.
- Do not overwrite outputs from previous runs.
- Store derived thumbnails only when needed for local review.
- Remove temporary model and image files after each failed or canceled run.
- Keep logs free of image bytes, signed URLs, personal filenames, and full local paths.

### 8.1 Retention

| Data | Default Local-Lab Retention |
| --- | --- |
| Synthetic inputs and outputs | Retain while the versioned benchmark remains approved |
| Team-owned person inputs | Delete after the approved test window; maximum 24 hours by default |
| Generated results from team-owned images | Delete after review; maximum 24 hours by default |
| Temporary files and caches containing media | Delete immediately after the run |
| Non-identifying benchmark metrics | Retain for model comparison |
| License and environment records | Retain with the experiment record |

Deletion must include inputs, masks, outputs, thumbnails, temporary files, and recoverable
copies under the lab operator's control.

## 9. Safety And Privacy Rules

### 9.1 Consent

- Obtain explicit, documented consent before using any real person's image.
- State the model purpose, local processing, retention period, and deletion method.
- Consent applies to a defined experiment and does not authorize training or publication.
- Withdrawal stops future use and triggers deletion of the person's media and outputs.
- Do not infer consent from employment, prior app use, or public availability.

### 9.2 Privacy

- Treat person images, masks, and generated results as sensitive private media.
- Use encrypted workstation storage with a locked user account.
- Do not place personal media in cloud-synced folders.
- Do not include names, emails, account IDs, or demographic labels in filenames.
- Do not use inputs or outputs for model training or fine-tuning.
- Do not perform face recognition, identity matching, body measurement, or demographic
  inference.
- Do not send telemetry containing images or image-derived personal data.
- Restrict local lab access to approved operators.
- Maintain a deletion log containing experiment IDs and status only.

### 9.3 Safety Review

Reject an input or suppress an output when it contains or produces:

- Nudity or sexualized content
- A suspected minor
- Non-consensual or exploitative imagery
- More than one person
- Severe anatomical distortion
- Exposure not present in the approved source
- Unsupported garment categories
- Content that could reasonably mislead a reviewer about fit, size, or body shape

Do not use arbitrary text prompts in the initial lab. Record safety failures without keeping
unsafe outputs longer than required to confirm and classify the failure.

## 10. Acceptance Gates

The local prototype is complete only when:

- A pinned CatVTON revision runs reproducibly on the selected workstation.
- The full approved smoke set completes without uncontrolled data movement.
- Peak VRAM, latency, and failure reasons are measured.
- Mask-generation behavior and dependencies are documented.
- Inputs and outputs follow retention and deletion rules.
- The model and artifact license inventory is complete.
- Quality and safety failures are represented, not hidden from the report.
- No Velora runtime component or production data source is involved.

Passing the local lab does not authorize app integration. Moving to the internal GPU worker
requires a separate architecture, privacy, security, and licensing review.

## 11. Known Risks

| Risk | Lab Control |
| --- | --- |
| Non-commercial or conflicting licenses | Keep use research-only; inventory every dependency and require legal review |
| Moving upstream dependencies | Pin repository commits, package versions, and artifact checksums |
| Windows and native-extension incompatibility | Prefer Linux or WSL2 and document the exact successful host |
| GPU out-of-memory failures | Batch size one, mixed precision, practical VRAM headroom, structured OOM logs |
| Poor mask quality | Preserve mask artifacts and compare automatic and reviewed variants |
| Biased or inconsistent output quality | Use a controlled, varied benchmark and segmented review |
| Accidental personal-data leakage | External encrypted lab directory, metadata stripping, short retention, no cloud sync |
| Cherry-picked quality conclusions | Fixed benchmark version, failed-run accounting, blinded review where practical |
| Misleading fit expectations | Persistent visual-estimate disclaimer and no size or fit claims |

## 12. Sources

- [CatVTON official repository](https://github.com/Zheng-Chong/CatVTON)
- [CatVTON dependency requirements](https://github.com/Zheng-Chong/CatVTON/blob/edited/requirements.txt)
- [CatVTON paper](https://arxiv.org/abs/2407.15886)
- [Velora Virtual Try-On Architecture](./VIRTUAL_TRY_ON_ARCHITECTURE.md)

Model setup instructions, dependencies, checkpoints, and licenses must be re-verified against
the exact revision selected for an experiment. This document is technical planning, not
legal advice.
