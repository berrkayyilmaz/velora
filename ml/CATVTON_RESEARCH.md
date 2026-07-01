# CatVTON Research Notes

Version: 1.0  
Status: Research Planning Only  
Last Updated: 2026-07-01

## 1. Scope

CatVTON is Velora's initial candidate for a local virtual try-on prototype. This
document records the current research hypothesis and the checks required before
any model download, environment installation, or inference implementation.

CatVTON is not approved for:

- Integration with the Velora backend or mobile app
- Use with production or beta user images
- Commercial use
- A closed-beta or production try-on service

All repository, checkpoint, dependency, and dataset details must be re-verified
against an exact pinned revision.

## 2. Purpose

CatVTON is an image-based virtual try-on diffusion model. Its intended task is
to transfer the visual appearance of a reference garment onto a target person
while preserving unrelated person and scene content.

The paper presents CatVTON as a simplified architecture using a VAE and
denoising UNet without separate image encoders, text encoders, or
cross-attention modules. The official repository describes:

- Approximately 899 million total parameters
- Approximately 49.6 million trainable parameters
- Simplified spatial concatenation of person and garment conditions
- Evaluation across VITON-HD and DressCode-style tasks

For Velora, CatVTON is a prototype candidate because its published inference
requirements appear lower and its model architecture appears simpler than the
other reviewed research implementations. This is not a production model
selection.

## 3. Expected Inputs

### 3.1 Conceptual Inputs

The minimum conceptual inputs are:

- A target person image
- A reference garment image

An integration may also require:

- Garment category
- Target region or agnostic mask
- Normalized image dimensions
- Seed and inference parameters
- Model and checkpoint revision

### 3.2 Person Image Assumptions

Initial research inputs should contain:

- One consenting adult
- Front-facing or near-front-facing pose
- Visible upper body
- Limited arm and accessory occlusion
- Sufficient resolution and sharpness
- Opaque clothing
- A simple or controlled background for the baseline set

CatVTON should first be evaluated on upper-body garments. Dresses, lower-body
items, complex poses, layered garments, and multiple people should remain
outside the first benchmark.

### 3.3 Garment Image Assumptions

Initial garment inputs should:

- Contain one upper-body garment
- Use a clear front-facing product view
- Avoid mannequins, people, severe folds, or unrelated objects
- Preserve visible texture, pattern, logo, and boundary details
- Have documented rights for research use

### 3.4 Preprocessing Caveat

The CatVTON paper describes inference without pose estimation, human parsing,
or captioning as model conditions. That does not prove the complete application
pipeline requires only two untouched image files.

The current official repository:

- Uses agnostic masks in VITON-HD and DressCode dataset inference.
- Includes a DressCode mask preprocessing script.
- Uses SCHP and DensePose to generate masks automatically in its Gradio and
  ComfyUI paths.
- References a separate mask-free checkpoint, which must be evaluated as a
  distinct model variant.

Velora must therefore treat mask generation and person-region preparation as
unverified pipeline dependencies until the exact prototype path is reproduced.

## 4. Expected Output

The expected output is one generated image that:

- Preserves the target person's identity-relevant visual appearance without
  performing identity recognition
- Replaces the selected clothing region with the reference garment appearance
- Retains non-target body regions and background where practical
- Uses the selected output resolution and deterministic seed

The output is a visual estimate only. It does not establish:

- Size
- Physical fit
- Fabric behavior
- Exact color reproduction
- Purchase suitability

Every retained result must record the model commit, checkpoint hash,
preprocessing versions, seed, resolution, precision, and inference parameters.

## 5. Hardware Expectations

The official repository reports approximately 8 GB VRAM for 1024x768 generation
with BF16.

Velora planning assumptions are more conservative:

| Resource | Prototype Minimum | Preferred |
| --- | --- | --- |
| GPU | NVIDIA CUDA GPU with 12 GB VRAM | NVIDIA GPU with 16 GB or more |
| System RAM | 16 GB | 32 GB or more |
| Free SSD | 40 GB | 100 GB or more |
| Batch size | 1 | 1 for baseline measurements |
| Host | Linux or WSL2 | Ubuntu Linux LTS |

Published model VRAM does not include guaranteed headroom for:

- Model loading peaks
- Automatic mask preprocessing
- CUDA context and allocator behavior
- Concurrent desktop GPU use
- Alternate checkpoints or dependency revisions
- Output inspection and notebook processes

CPU-only execution is not an acceptance path. It may verify imports or
preprocessing, but it must not be used for latency, quality, or production-cost
conclusions.

## 6. Current Upstream Execution Signals

The official repository currently documents:

- A Python 3.9 Conda environment
- A Gradio app entry point using `app.py`
- BF16 and TF32 options
- Automatic checkpoint download from Hugging Face
- Dataset inference through `inference.py`
- VITON-HD and DressCode input structures

These are upstream signals, not approved Velora commands. Python 3.9 is
end-of-life and conflicts with the preferred Python 3.11 lab baseline. The
exact pinned CatVTON revision must first be tested under Python 3.11. If that
fails, a disposable Python 3.9 reproduction environment may be used for local
research only.

## 7. Licensing Concerns

The current CatVTON repository states that its code, checkpoints, and demo are
licensed under CC BY-NC-SA 4.0. The non-commercial restriction blocks assuming
that the published implementation or weights can power a commercial Velora
beta or production service.

Separate review is required for:

- CatVTON source code
- CatVTON checkpoints
- Stable Diffusion 1.5 inpainting base model
- Diffusers and other code dependencies
- SCHP and DensePose preprocessing
- VITON-HD and DressCode datasets
- Hugging Face model access and distribution terms
- Any mask-free, FLUX, or community variant

Technical availability does not establish commercial permission. No Velora
product integration may begin until the complete artifact chain has a
documented licensing decision.

## 8. Model Weights Access

The official repository currently links weights hosted through Hugging Face and
can download checkpoints automatically for app and inference paths.

Before access, verify:

- Exact model repository and revision
- Whether access is public, gated, or account-bound
- Terms accepted during download
- File names and expected sizes
- Cryptographic checksums
- Base-model dependencies
- Cache location
- Offline loading behavior
- Redistribution restrictions
- Whether automatic downloads include additional unreviewed artifacts

Weights must remain outside Git and outside application runtime directories.
Automatic download must be disabled or controlled after the first approved,
checksummed artifact snapshot.

## 9. Brief Candidate Comparison

| Area | CatVTON | IDM-VTON | StableVITON |
| --- | --- | --- | --- |
| Initial role | Preferred local prototype | Quality comparison | Reproducible baseline |
| Architecture signal | Simplified VAE and UNet with spatial concatenation | SDXL-based conditioning with visual encoder and parallel UNet components | Latent diffusion with learned semantic correspondence |
| Preprocessing signal | Dataset masks; app auto-mask through SCHP and DensePose | Human parsing, DensePose, OpenPose, masks, and garment captions in available flows | Agnostic masks, cloth masks, and DensePose |
| Published runtime signal | About 8 GB VRAM at 1024x768 with BF16 | No equivalent low-memory claim verified; expected to be heavier | Older pinned CUDA and dependency stack; benchmark required |
| Operational risk | Lowest of the three, but mask path remains unresolved | Highest preprocessing and model complexity | Significant preprocessing and environment maintenance |
| Repository license | CC BY-NC-SA 4.0 | CC BY-NC-SA 4.0 | CC BY-NC-SA 4.0 |

IDM-VTON may be useful if CatVTON fails garment-fidelity requirements.
StableVITON may provide a comparison baseline, but neither removes the
commercial licensing blocker or the need for a complete preprocessing
benchmark.

## 10. Integration Risks

### 10.1 Licensing

Non-commercial licenses may prevent any product use. Base models, datasets, and
preprocessors may introduce additional restrictions.

### 10.2 Preprocessing

Mask generation may fail on loose garments, layered clothing, hair occlusion,
crossed arms, bags, complex backgrounds, and non-standard poses.

### 10.3 Output Quality

Potential failures include:

- Garment texture or logo distortion
- Body-shape distortion
- Face, hand, hair, or background changes
- Boundary artifacts
- Incorrect handling of occlusion
- Color shift
- Inconsistent output across seeds
- Uneven quality across body presentations and skin tones

### 10.4 Runtime

Published VRAM figures may not match the complete local pipeline. Cold start,
mask generation, model download, allocator fragmentation, and invalid inputs
can materially change latency and memory use.

### 10.5 Privacy And Safety

Person images and generated results are sensitive private media. The local
prototype must use synthetic or explicitly approved test images, short
retention, encrypted storage, no cloud sync, and no training on user media.

### 10.6 Application Boundary

Research code must not run inside Fastify request handlers. Any later
integration requires an isolated asynchronous GPU worker, durable jobs, private
storage, consent, retention, deletion, and output-safety controls.

### 10.7 Supply Chain

Moving Git dependencies, automatic checkpoint downloads, native extensions,
and old Python/CUDA pins can make a successful run difficult to reproduce or
unsafe to maintain.

## 11. Required Verification Before Implementation

### 11.1 License

Verify:

- Exact license text at the pinned source revision
- Code, checkpoint, base-model, dataset, and preprocessing licenses
- Whether internal commercial-company evaluation is permitted
- Whether generated output has reuse restrictions
- Whether a commercial license or replacement path exists

Required evidence:

- Reviewed software/model/dataset bill of materials
- Stored license snapshots and retrieval dates
- Written legal decision for the intended experiment and any later product use

### 11.2 Model Weights Access

Verify:

- Exact download location and access requirements
- Artifact names, sizes, revisions, and checksums
- Offline loading from an approved local cache
- All transitively downloaded weights

Required evidence:

- Artifact inventory with hashes
- Reproducible clean-machine download and offline-load procedure

### 11.3 Input Preprocessing

Verify:

- Required person, garment, category, and mask inputs
- Whether the selected checkpoint is mask-based or mask-free
- Exact SCHP, DensePose, or other preprocessor dependencies
- Image resolution, orientation, color-space, and normalization rules
- Failure behavior for unsupported poses and garments

Required evidence:

- Versioned input contract
- Fixed preprocessing samples and expected intermediate artifacts
- Documented rejection reasons

### 11.4 Inference Command

Verify:

- Exact environment and command for one pinned checkpoint
- Required flags, paths, precision, resolution, seed, and device
- Whether checkpoints download automatically
- Exit codes and structured failure behavior
- Repeatability from a clean environment

Required evidence:

- One reviewed, reproducible command recorded in a future runbook
- Run manifest containing environment, model, input, and parameter hashes

No inference command is approved or executed by this document.

### 11.5 Output Quality

Verify:

- Garment detail preservation
- Non-garment person and background preservation
- Boundary and occlusion quality
- Seed consistency
- Quality across approved body presentations, skin tones, poses, backgrounds,
  and garment patterns
- Safety rejection behavior

Required evidence:

- Fixed benchmark set
- Blind review rubric where practical
- Failed-result accounting
- Explicit quality and safety thresholds

### 11.6 VRAM And Runtime

Verify:

- Cold model-load time
- Warm inference latency
- Preprocessing latency
- Peak allocated and reserved VRAM
- System RAM and disk use
- OOM recovery
- Behavior at batch size one
- BF16, FP16, and TF32 compatibility on the selected GPU

Required evidence:

- Hardware and driver baseline
- Multiple measured runs with fixed inputs and seeds
- Separate cold, warm, preprocessing, and inference measurements

## 12. Prototype Go/No-Go Gate

Proceed to local implementation only when:

- The exact research use is approved under every relevant license.
- Weight access and artifact hashes are documented.
- The complete input and mask contract is understood.
- A clean environment can reproduce the intended command.
- The benchmark and review rubric are approved.
- Available hardware has adequate measured VRAM headroom.
- Private input and output retention rules are operational.

Failure of any licensing, privacy, or artifact-access gate is a no-go regardless
of expected visual quality.

## 13. Sources

- [CatVTON official repository](https://github.com/Zheng-Chong/CatVTON)
- [CatVTON paper](https://arxiv.org/abs/2407.15886)
- [IDM-VTON official repository](https://github.com/yisol/IDM-VTON)
- [StableVITON official repository](https://github.com/rlawjdghek/StableVITON)
- [Velora Virtual Try-On Architecture](../docs/VIRTUAL_TRY_ON_ARCHITECTURE.md)
- [Velora AI Lab Setup](../docs/AI_LAB_SETUP.md)
- [Velora Python Environment Plan](./PYTHON_ENV.md)

This document is a technical research note, not legal advice.
