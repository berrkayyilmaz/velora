# Velora AI Benchmark Dataset Plan

Version: 1.0  
Status: Planning Only  
Last Updated: 2026-07-01

## 1. Purpose

This document defines a safe local dataset structure for comparing self-hosted
virtual try-on providers.

The dataset is for:

- Environment smoke testing
- Input and preprocessing validation
- Provider quality comparison
- Runtime and VRAM measurement
- Safety and failure analysis

It is not a training dataset, production dataset, user-media archive, or
source of marketing images.

No assets are downloaded or created by this document.

## 2. Storage Boundary

All benchmark assets must remain under the ignored local data workspace or in
an approved external encrypted directory.

Recommended local structure:

```text
ml/data/input/benchmarks/
`-- <dataset-id>/
    |-- manifest.json
    |-- provenance/
    |   `-- asset-rights.json
    |-- assets/
    |   |-- persons/
    |   |-- garments/
    |   `-- masks/
    `-- splits/
        |-- smoke.json
        |-- quality.json
        `-- stress.json

ml/data/output/benchmarks/
`-- <run-id>/
    |-- run-manifest.json
    |-- results/
    |-- metrics/
    `-- reviews/
```

The entire `ml/data/input` and `ml/data/output` content is ignored by Git except
for tracked `.gitkeep` files.

Rules:

- Never force-add ignored benchmark files.
- Never store assets in notebooks, source folders, issue attachments, or chat
  transcripts.
- Never use cloud-synced folders for private or consent-controlled media.
- Keep input assets read-only during benchmark runs.
- Write generated results only to the matching output run directory.
- Use encrypted local storage where real people appear in a permitted public
  research dataset.

## 3. Dataset Identity

Each dataset snapshot requires:

- Stable `datasetId`
- Semantic dataset version
- Creation timestamp
- Purpose
- Owner
- License and provenance review status
- Asset manifest hash
- Split manifest hashes
- Review rubric version
- Retention policy

Example identity:

```text
datasetId: velora-vton-local
version: 1.0.0
```

Any asset, metadata, split, or expected-mask change creates a new dataset
version. Existing benchmark versions must not be edited after results are
recorded.

## 4. Permitted Asset Sources

Use only:

- Synthetic person images created for testing
- Synthetic garment images created for testing
- Public research assets with explicit terms permitting the intended local
  evaluation
- Public-domain assets with documented provenance
- Assets created by Velora specifically for non-user benchmark testing

Do not use:

- Real Velora user images
- Closed-beta or production uploads
- Images copied from retailer websites
- Images copied from social media, search results, blogs, or marketplaces
- Creator or influencer images without explicit written permission
- Public-figure images
- Images with unknown source or unclear license
- Images whose terms prohibit modification, model evaluation, or generated
  derivatives
- Assets obtained by scraping

Public availability is not permission. Every asset must have an approved
provenance record before use.

Synthetic assets are preferred for the smoke split. Publicly permitted research
assets may be considered for quality evaluation only after license and privacy
review.

## 5. Required Sample Types

### 5.1 Person Or Model Images

Each person asset should contain:

- One person only
- An adult presentation
- Front-facing or documented pose
- Visible target garment region
- Opaque clothing
- Supported image type
- Sufficient resolution
- No embedded personal metadata

The dataset should cover:

- Varied body presentations
- Varied skin tones
- Straight and mildly occluded poses
- Simple and complex backgrounds
- Different lighting conditions
- Hair lengths and arm positions that affect garment boundaries

Coverage labels are benchmark descriptors, not identity claims. Do not attach
names, emails, account IDs, biometric templates, inferred ethnicity, or other
personal identifiers.

### 5.2 Garment Images

Each garment asset should contain:

- One garment
- Known normalized category
- Clear front view
- Minimal occlusion
- Supported image type
- Sufficient resolution
- Documented creation or usage rights

The benchmark should cover:

- Solid colors
- Light and dark garments
- Fine and large patterns
- Textures
- Logos or text only when the asset rights permit generated transformations
- Loose and fitted silhouettes
- Sleeveless, short-sleeve, and long-sleeve upper-body garments

The initial dataset should use only `upper_body`. Other categories require a new
dataset version and capability review.

### 5.3 Masks

Masks are included when required by the provider or preprocessing benchmark.

Mask requirements:

- Stable relationship to one person asset
- Same normalized width and height as the person input
- Lossless PNG
- One-channel or explicitly documented binary representation
- Documented generation method
- Preprocessor name, version, and parameters
- Human-review status
- Hash in the manifest

Keep separate variants for:

- Automatically generated mask
- Reviewed mask
- Manually corrected mask, if permitted

Never overwrite an automatic mask with a corrected mask. Each variant is a
separate asset and case configuration.

### 5.4 Expected Metadata

Each asset record should include:

| Field | Purpose |
| --- | --- |
| `assetId` | Stable non-identifying asset ID. |
| `assetType` | `person`, `garment`, or `mask`. |
| `fileName` | Relative local file name. |
| `sha256` | Content identity. |
| `mediaType` | Validated image media type. |
| `width` | Decoded width. |
| `height` | Decoded height. |
| `category` | Normalized garment category where applicable. |
| `sourceType` | `synthetic`, `public_domain`, `licensed_research`, or `velora_created`. |
| `provenanceRef` | Reference to the local rights record. |
| `licenseStatus` | `approved`, `blocked`, or `pending`. |
| `synthetic` | Whether the visual subject is synthetic. |
| `createdAt` | Manifest record timestamp. |
| `retentionUntil` | Required deletion or review date when applicable. |

Optional benchmark descriptors may include:

- Pose class
- Background complexity
- Lighting class
- Garment color family
- Pattern complexity
- Sleeve type
- Occlusion class

Metadata must not include:

- Person name
- Email or account ID
- Original public URL
- Precise location
- EXIF data
- Face embedding
- Body measurement
- Inferred demographic identity
- Private consent text

## 6. Naming Conventions

Names must be stable, lowercase ASCII, and non-identifying.

### 6.1 Asset IDs

```text
person-syn-0001
garment-upper-solid-0001
mask-person-syn-0001-auto-v1
```

### 6.2 File Names

```text
person-syn-0001.png
garment-upper-solid-0001.png
mask-person-syn-0001-auto-v1.png
```

### 6.3 Case IDs

```text
case-smoke-0001
case-quality-0001
case-stress-0001
```

### 6.4 Run IDs

```text
run-<utc-date>-<provider-id>-<short-random-id>
```

Example:

```text
run-20260701-catvton-a1b2c3
```

Do not include names, emails, model URLs, machine usernames, or source website
names in asset, case, or run identifiers.

## 7. Case Contract

Each evaluation case should reference:

| Field | Required | Purpose |
| --- | --- | --- |
| `caseId` | Yes | Stable case identifier. |
| `split` | Yes | `smoke`, `quality`, or `stress`. |
| `personAssetId` | Yes | Person input. |
| `garmentAssetId` | Yes | Garment input. |
| `garmentCategory` | Yes | Normalized category. |
| `maskAssetId` | Conditional | Registered mask variant. |
| `poseAssetId` | Conditional | Registered pose input. |
| `seedSet` | Yes | Fixed inference seeds. |
| `targetResolution` | Yes | Common benchmark resolution. |
| `expectedCapabilities` | Yes | Provider capabilities required by the case. |
| `reviewTags` | Yes | Approved quality dimensions. |
| `expectedOutcome` | Yes | `success`, `reject`, or provider-dependent. |

Expected outcome describes contract behavior, not an expected generated image.
The dataset must not contain hand-authored "ideal" outputs unless a paired,
licensed benchmark explicitly provides them.

## 8. Evaluation Splits

### 8.1 Smoke Split

Purpose:

- Verify environment and model loading
- Verify input contracts
- Verify preprocessing
- Verify output decoding
- Verify failure codes

Initial target:

- 6-12 cases
- Synthetic assets preferred
- Simple poses and backgrounds
- Clear upper-body garments
- At least one expected rejection
- At least one mask-required case

Smoke results do not establish quality.

### 8.2 Quality Split

Purpose:

- Compare garment and person preservation
- Compare providers and pipeline versions
- Establish quality acceptance evidence

Initial target:

- 40-100 fixed cases
- Balanced approved benchmark descriptors
- Multiple garments per controlled person presentation
- Multiple person presentations per garment class
- Fixed seed set
- Automatic and reviewed mask variants where relevant

The quality split must remain hidden from provider-specific tuning where
practical. Any tuning subset must be declared separately.

### 8.3 Stress Split

Purpose:

- Expose known failure modes
- Test rejection and timeout behavior
- Measure memory and preprocessing limits

Candidate stress cases:

- Complex backgrounds
- Mild pose occlusion
- Hair crossing the garment region
- Long sleeves and arm overlap
- Fine patterns or text
- Very light or dark garments
- Loose silhouettes
- Boundary-heavy garments
- Minimum and maximum accepted dimensions
- Intentionally invalid masks
- Unsupported category requests

Initial target:

- 20-50 cases
- Explicit expected success or rejection
- Separate reporting from the quality split

Stress failures must not be removed to improve aggregate scores.

## 9. Split Isolation

- One case belongs to exactly one split.
- Exact person-garment pairs must not appear in multiple splits.
- Duplicate or near-duplicate assets must be identified by hash and review.
- Provider tuning must not use quality or stress outputs as training data.
- Failed cases remain in their original split.
- Split membership changes require a new dataset version.
- Metrics must always identify the dataset and split version.

## 10. Quality Review Checklist

### 10.1 Input Validity

- [ ] Person image contains one supported adult presentation.
- [ ] Garment image contains one supported garment.
- [ ] Category is correct.
- [ ] Input dimensions and orientation are valid.
- [ ] Mask and pose assets align with the person image.
- [ ] Asset provenance and license status are approved.

### 10.2 Output Validity

- [ ] Output decodes successfully.
- [ ] Output dimensions match the contract.
- [ ] Output contains no unexpected metadata.
- [ ] No unrelated input or previous output appears.
- [ ] Result is associated with the correct case and provider version.

### 10.3 Garment Fidelity

- [ ] Garment silhouette is preserved.
- [ ] Color remains acceptably consistent.
- [ ] Pattern and texture remain recognizable.
- [ ] Logos or text are not materially distorted where included.
- [ ] Sleeves, neckline, and hem are plausible.

### 10.4 Person Preservation

- [ ] Face remains visually consistent.
- [ ] Hair remains plausible.
- [ ] Hands and arms remain plausible.
- [ ] Body shape is not materially distorted.
- [ ] Non-target clothing and accessories remain stable.

### 10.5 Composition

- [ ] Garment boundaries are clean.
- [ ] Occlusion is handled plausibly.
- [ ] Background remains stable.
- [ ] Lighting and shadows are coherent.
- [ ] No obvious seams, holes, duplicated regions, or texture bleeding appear.

### 10.6 Safety And Usefulness

- [ ] No unsafe exposure is introduced.
- [ ] No severe anatomical distortion appears.
- [ ] Output does not imply exact size or fit.
- [ ] Result is useful as a visual estimate.
- [ ] Result should be accepted, accepted with warning, or rejected.

## 11. Review Scoring

Use a fixed five-point scale for:

- Garment fidelity
- Person preservation
- Boundary quality
- Background preservation
- Overall usefulness

Suggested interpretation:

| Score | Meaning |
| --- | --- |
| 1 | Unusable or unsafe |
| 2 | Major visible failures |
| 3 | Usable only with clear limitations |
| 4 | Good result with minor artifacts |
| 5 | Strong result for the defined benchmark |

Also record binary rejection reasons. Average scores must never hide safety
rejections or severe failures.

## 12. Privacy And Retention

- No real Velora user image may enter the benchmark dataset.
- No private user image may be committed, even if Git ignore rules exist.
- No copyrighted retailer image may be committed or used without explicit
  permission covering the intended evaluation.
- Synthetic and publicly permitted assets must still have provenance records.
- Remove EXIF, location, and unnecessary embedded metadata.
- Do not place image bytes or private paths in logs or analytics.
- Delete blocked, expired, or withdrawn assets immediately.
- Apply the shortest approved retention period to person images and generated
  outputs.
- Generated results inherit the restrictions of all source assets.

Git ignore rules reduce accidental commits but are not a privacy or access
control.

## 13. Dataset Approval Gate

A dataset version is eligible for local benchmarking only when:

- Every asset has a hash and approved provenance record.
- No user, retailer-scraped, or unknown-source image is present.
- Split manifests are frozen and hashed.
- Input files pass deterministic validation.
- Required masks and metadata are complete.
- The quality rubric version is assigned.
- Retention and deletion responsibilities are assigned.
- A reviewer confirms that Git does not track any asset or generated output.

## 14. Related Documents

- [AI Provider Benchmark Framework](./AI_PROVIDER_FRAMEWORK.md)
- [CatVTON Research Notes](./CATVTON_RESEARCH.md)
- [Python Environment Plan](./PYTHON_ENV.md)
- [AI Lab Setup](../docs/AI_LAB_SETUP.md)

