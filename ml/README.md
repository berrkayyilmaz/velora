# Velora AI Workspace

## Purpose

The `ml/` workspace is an isolated foundation for future local evaluation of
self-hosted fashion and virtual try-on models. It is not part of the current
backend, frontend, or admin runtime.

This workspace may later contain reviewable:

- Model adapter source code
- Local experiment scripts
- Notebooks with cleared outputs
- Lightweight environment manifests
- Non-sensitive benchmark definitions

No inference implementation, model installation, or model download is included
in this foundation.

## Boundaries

- Do not import ML code into the Fastify backend.
- Do not connect experiments to the Velora database or production APIs.
- Do not use production, beta, or unapproved user media.
- Keep one isolated Python environment per model candidate.
- Pin model repositories, dependencies, and checkpoints before recording
  benchmark results.
- Review code, model, checkpoint, base-model, and dataset licenses separately.
- Follow [`docs/AI_LAB_SETUP.md`](../docs/AI_LAB_SETUP.md) and
  [`docs/VIRTUAL_TRY_ON_ARCHITECTURE.md`](../docs/VIRTUAL_TRY_ON_ARCHITECTURE.md)
  before running future experiments.

## Structure

```text
ml/
|-- models/       Local model checkouts and weights; ignored
|-- data/
|   |-- input/    Approved local test inputs; ignored
|   `-- output/   Generated images and run outputs; ignored
|-- notebooks/    Reviewable notebooks; clear embedded outputs before commit
`-- scripts/      Future reusable experiment and validation scripts
```

The tracked `.gitkeep` files preserve the empty directory structure only.

## Data And Artifact Rules

The following must never be committed:

- Model weights
- Checkpoints
- Downloaded datasets
- Generated images or experiment outputs
- Private user images
- Team-member images unless a separately approved fixture is explicitly
  anonymized and licensed for repository use
- Model caches, Python virtual environments, notebook checkpoints, or secrets

Prefer storing all real experiment inputs and outputs outside the repository.
If local files are temporarily placed under `ml/data/input` or
`ml/data/output`, Git ignores them, but ignore rules are not a privacy control.
Operators remain responsible for consent, access restrictions, retention, and
secure deletion.

## Python Environment Planning

No shared Python environment is defined yet. When a model candidate is
approved:

1. Select the Python and CUDA versions required by the pinned upstream commit.
2. Create a local environment under `ml/.venv` or outside the repository.
3. Add only a reviewed, reproducible environment manifest.
4. Keep downloaded packages, caches, model artifacts, and credentials ignored.

Do not install ML dependencies into the Node.js workspaces.
