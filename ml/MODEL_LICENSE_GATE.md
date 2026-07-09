# Velora AI Model License Gate

Version: 1.0  
Status: Planning Only  
Last Updated: 2026-07-09

## 1. Purpose

This document defines the approval checklist that must be completed before
Velora tests, downloads, runs, adapts, or integrates any third-party virtual
try-on model.

This is a product and engineering gate, not legal advice. Any model intended
for customer-facing, commercial, production, or revenue-adjacent use requires
formal legal review and written approval before implementation.

## 2. Gate Rule

No AI model may be tested unless all of the following are true:

- The model source, license, weights source, and model card are identified.
- The model status is explicitly marked as `approved`, `research-only`, or
  `rejected`.
- The permitted use is clear enough for the intended experiment.
- Dataset restrictions are understood.
- Weight download and storage rules are documented.
- Required attribution is documented.
- The experiment uses only synthetic or explicitly permitted assets.
- The experiment does not process real Velora user images.
- The experiment does not commit model weights, datasets, generated outputs, or
  private images to the repository.

If any required field is unknown, the status must be `research-only` or
`rejected`, never `approved`.

## 3. Status Definitions

| Status | Meaning | Allowed Use |
| --- | --- | --- |
| `approved` | License, weights, datasets, attribution, and intended usage have been reviewed and approved. | Only the approved usage. |
| `research-only` | The model may be evaluated in an isolated AI lab using permitted non-user assets, but is not approved for product use. | Local/cloud research only. |
| `rejected` | The model cannot be used for the proposed Velora purpose. | No testing, download, integration, or redistribution. |

For Velora, noncommercial licenses must be treated as incompatible with
customer-facing product use unless separate commercial permission is obtained.

## 4. Required Review Checklist

### 4.1 Source And Identity

- Model name.
- Model version or commit SHA.
- Official repository URL.
- Official paper URL.
- Official model card URL, if available.
- Official weights URL.
- Maintainer or organization.
- Date reviewed.
- Reviewer.

### 4.2 License Type

- License name.
- License version.
- License URL.
- Whether license covers:
  - Code.
  - Model weights.
  - Demo assets.
  - Documentation.
  - Generated outputs, if stated.
- Whether different components have different licenses.
- Whether upstream base models have separate licenses.
- Whether dependencies introduce additional restrictions.

### 4.3 Commercial Use

- Commercial use allowed: yes, no, or unclear.
- SaaS/customer-facing use allowed: yes, no, or unclear.
- Internal company research allowed: yes, no, or unclear.
- Paid API use allowed: yes, no, or unclear.
- Affiliate/revenue-adjacent use allowed: yes, no, or unclear.
- Separate commercial license available: yes, no, or unknown.

If commercial use is prohibited or unclear, do not use the model in production,
closed beta user flows, public beta user flows, paid demos, or brand-facing
workflows.

### 4.4 Weights Redistribution Rules

- Can weights be downloaded?
- Can weights be stored internally?
- Can weights be mirrored?
- Can weights be redistributed?
- Can derivative checkpoints be created?
- Can derivative checkpoints be shared?
- Are checksums or release tags available?
- Are access tokens or account terms required?

Model weights must not be committed to the Velora repository.

### 4.5 Dataset Restrictions

- Training datasets named by the model.
- Inference examples named by the model.
- Dataset licenses reviewed.
- Dataset commercial restrictions reviewed.
- Whether test assets may be used in a startup research context.
- Whether generated outputs may inherit dataset restrictions.
- Whether real user images are prohibited for current experiments.

Do not use copyrighted retailer images, social media images, private wardrobe
images, or real user images in model tests.

### 4.6 Attribution Requirements

- Required citation.
- Required copyright notice.
- Required license notice.
- Required model/source link.
- Required change notice for modifications.
- Required attribution placement for internal reports.
- Required attribution placement for any public demo, if permitted.

### 4.7 Derivative Work Restrictions

- Can code be modified?
- Can model architecture be modified?
- Can model weights be fine-tuned?
- Can LoRA/adapters be trained?
- Can modified code or weights be shared?
- Must derivatives use the same license?
- Are additional restrictions prohibited?

### 4.8 Privacy And Safety

- Does the model require person images?
- Does the model require segmentation, pose, or masks?
- Does the model save inputs by default?
- Does the model include telemetry, external downloads, or hosted API calls?
- Can the experiment run fully offline after setup?
- Are outputs synthetic enough for safe internal review?
- Is there a deletion plan for inputs and outputs?

## 5. Approval Record Template

```text
Model:
Candidate version or commit:
Review date:
Reviewer:

Official repository:
Official paper:
Official model card:
Official weights:

License type:
License URL:
License covers code:
License covers weights:
Commercial use allowed:
Internal research allowed:
Redistribution allowed:
Derivative/fine-tuned weights allowed:
Attribution required:
Share-alike required:

Known dataset restrictions:
Known base model restrictions:
Known dependency restrictions:

Allowed experiment scope:
Disallowed uses:
Required cleanup:

Status: approved | research-only | rejected
Approval notes:
```

## 6. Initial Candidate Review

Initial status is intentionally conservative. These candidates are not approved
for Velora product use.

| Candidate | Source Links | Observed License | Commercial Use | Initial Status | Notes |
| --- | --- | --- | --- | --- | --- |
| CatVTON | [GitHub](https://github.com/Zheng-Chong/CatVTON), [Project](https://zheng-chong.github.io/CatVTON/), [Paper](https://arxiv.org/abs/2407.15886) | CC BY-NC-SA 4.0 for code, checkpoints, and demo according to the official README. | Not allowed under the public noncommercial license. | `research-only` | Good prototype candidate only after license, weights, base-model, and dataset review. No product or commercial testing without separate permission. |
| IDM-VTON | [GitHub](https://github.com/yisol/IDM-VTON), [Hugging Face](https://huggingface.co/yisol/IDM-VTON), [Project](https://idm-vton.github.io/), [Paper](https://arxiv.org/abs/2403.05139) | CC BY-NC-SA 4.0 for code and checkpoints according to GitHub and Hugging Face. | Not allowed under the public noncommercial license. | `research-only` | Strong benchmark candidate, but dependency, masking, dataset, and commercial-license constraints must be reviewed. |
| StableVITON | [GitHub](https://github.com/rlawjdghek/StableVITON), [Project](https://rlawjdghek.github.io/StableVITON/), [Paper](https://arxiv.org/abs/2312.01725) | CC BY-NC-SA 4.0 according to the official README. | Not allowed under the public noncommercial license. | `research-only` | Requires careful review of checkpoint source, VITON-HD assumptions, DensePose/mask requirements, and base-model restrictions. |

## 7. Candidate Notes

### 7.1 CatVTON

Current planning position:

- Preferred first prototype candidate for technical simplicity and reported
  lower VRAM needs.
- Public license appears noncommercial and share-alike.
- Not approved for production, closed beta users, customer images, paid demos,
  affiliate flows, or brand-facing workflows.

Must verify before testing:

- Exact repository commit.
- Exact checkpoint source and terms.
- Whether the license covers every downloaded checkpoint.
- Base Stable Diffusion inpainting license obligations.
- Dataset assumptions for VITON-HD and DressCode.
- Required mask or mask-free path.
- Whether internal startup research is acceptable under the license.

### 7.2 IDM-VTON

Current planning position:

- Useful benchmark candidate because it is widely referenced and has Hugging
  Face availability.
- Public license appears noncommercial and share-alike.
- Not approved for production or commercial use.

Must verify before testing:

- Whether Hugging Face files exactly match the official GitHub release.
- Exact checkpoint license and download conditions.
- Dependency and preprocessing requirements.
- Dataset restrictions and generated-output assumptions.
- Whether any separate commercial license path exists.

### 7.3 StableVITON

Current planning position:

- Useful comparison candidate for output quality and architecture research.
- Public license appears noncommercial and share-alike.
- Not approved for production or commercial use.

Must verify before testing:

- Exact checkpoint source and continued availability.
- Whether the SharePoint-hosted checkpoints have separate terms.
- DensePose, agnostic mask, and VITON-HD assumptions.
- Base model and dataset restrictions.
- Whether arbitrary image preprocessing is stable enough for Velora-style
  wardrobe inputs.

## 8. Minimum Approval Outcomes

Before local or cloud notebook testing:

- Status may be `research-only`.
- Only synthetic or explicitly permitted benchmark assets may be used.
- Weights may be downloaded only into ignored local/cloud experiment folders.
- Outputs must remain local/cloud artifacts and must not be committed.
- Results may be summarized in Markdown without embedding private images.

Before closed beta:

- Status must be `approved`.
- Commercial/customer-facing use must be explicitly permitted.
- User consent and deletion rules must be implemented.
- Storage, retention, and data processing policies must be reviewed.
- Security review must approve the model runtime and file handling.

Before production:

- Status must be `approved`.
- Legal review must approve the full commercial use case.
- Attribution and license notices must be implemented where required.
- Vendor, hosted, or self-hosted model obligations must be documented.
- Rollback and model-removal procedures must exist.

## 9. Rejection Triggers

Reject a model for Velora use if:

- License prohibits the intended use.
- Commercial use is prohibited and no separate license is available.
- Weight redistribution/storage rules are incompatible with Velora operations.
- Dataset restrictions contaminate intended usage.
- Attribution or share-alike obligations are incompatible with the product.
- The model requires user images to be sent to uncontrolled third-party systems.
- The model source or weights cannot be verified.
- The model includes undisclosed telemetry or unsafe download behavior.

## 10. Source Evidence Reviewed

- CatVTON official repository:
  <https://github.com/Zheng-Chong/CatVTON>
- CatVTON official project page:
  <https://zheng-chong.github.io/CatVTON/>
- IDM-VTON official repository:
  <https://github.com/yisol/IDM-VTON>
- IDM-VTON Hugging Face model card:
  <https://huggingface.co/yisol/IDM-VTON>
- StableVITON official repository:
  <https://github.com/rlawjdghek/StableVITON>
- StableVITON official project page:
  <https://rlawjdghek.github.io/StableVITON/>
- Creative Commons BY-NC-SA 4.0 deed:
  <https://creativecommons.org/licenses/by-nc-sa/4.0/>

