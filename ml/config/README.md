# AI Runner Configuration

## Purpose

This directory contains reviewable configuration templates for future local AI
runners. It does not contain a parser, runnable model configuration, package
manifest, checkpoint reference, or secret.

The current example defines only the common runner fields needed to plan a
single-provider local smoke run.

## Strategy

- Use JSON for the initial runner configuration.
- Validate configs against a strict schema before any model is loaded.
- Reject unknown fields.
- Resolve relative paths from the `ml/` workspace root.
- Canonicalize paths and reject traversal outside approved ML directories.
- Keep inputs read-only.
- Create a unique output directory per run.
- Require one explicit provider and device.
- Do not silently change provider, device, image size, batch size, or seed.
- Keep batch size at one until measured hardware evidence supports another
  value.

## Template

[`example.runner.json`](./example.runner.json) is documentation, not an
approved inference configuration.

Before a future run, every placeholder must be replaced with values matching:

- A registered provider adapter
- A pinned model revision
- Verified local model artifacts
- A versioned benchmark dataset
- The selected GPU and precision
- Approved input and output roots

## Field Definitions

| Field | Purpose |
| --- | --- |
| `provider` | Stable registered provider ID. |
| `device` | Explicit execution device such as `cuda:0` or approved `cpu` validation mode. |
| `inputDir` | Relative path to one approved benchmark dataset directory. |
| `outputDir` | Relative root for ignored generated run outputs. |
| `modelPath` | Relative path to ignored local model code and artifacts. |
| `maxBatchSize` | Maximum cases passed to the model together. Initially `1`. |
| `imageSize.width` | Normalized input and output width. |
| `imageSize.height` | Normalized input and output height. |
| `seed` | Fixed integer used for reproducibility. |

## Safety Rules

Config files must not contain:

- Tokens, passwords, or signed URLs
- Model download credentials
- Public checkpoint URLs
- Person names, emails, or user IDs
- Private image data
- Production storage locations
- Arbitrary shell commands
- Unpinned Git branches

Machine-specific configs must not be committed. Before local configs are
introduced, they must use an ignored naming convention such as
`*.local.runner.json`.

Model weights, datasets, private inputs, and generated outputs remain ignored
under the existing ML artifact rules.

## Future Validation

A future runner must reject a config when:

- The provider is not registered.
- The device is unavailable.
- A path escapes the `ml/` workspace or approved external root.
- The input directory is not a versioned benchmark dataset.
- The output directory already belongs to another run.
- Model artifacts are missing or fail checksum verification.
- Batch size, image dimensions, or seed are outside the provider capability
  contract.

No validation code is implemented by this scaffold.
