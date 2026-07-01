# Velora AI Local Python Environment Plan

Version: 1.0  
Status: Planning Only  
Last Updated: 2026-07-01

## 1. Purpose

This document defines the proposed local Python environment for the isolated
Velora AI workspace. It does not install Python, create an environment, add
dependencies, download models, or implement inference.

The environment must remain separate from the backend, frontend, and admin
workspaces.

## 2. Recommended Python Version

Use **Python 3.11** as the default for new Velora AI lab tooling.

Reasons:

- Python 3.11 remains under upstream security support.
- Current stable PyTorch requires Python 3.10 or later.
- Python 3.11 provides a conservative compatibility target for modern ML,
  image-processing, and notebook packages.
- It avoids making the lab depend on Python 3.9, which reached end of life.

Model-specific compatibility takes precedence for reproduction work. If a
pinned research repository requires another Python version:

- Create a separate environment for that model.
- Record the exact Python, package, CUDA, repository, and checkpoint versions.
- Do not weaken the default lab environment to accommodate one legacy model.
- Treat an unsupported Python version as local research-only and never expose
  it as a network service.

CatVTON's current upstream setup documents Python 3.9. That version may be used
only in a disposable, isolated reproduction environment if the pinned revision
cannot run under Python 3.11.

## 3. Virtual Environment Strategy

### 3.1 Default Environment

Use one ignored environment at:

```text
ml/.venv
```

The environment must not be committed. Editors and notebooks should be
configured to use this interpreter explicitly.

Planned creation command:

```powershell
cd ml
uv venv --python 3.11 .venv
```

Activation is optional when commands use `uv run`. If activation is useful:

```powershell
.\.venv\Scripts\Activate.ps1
```

For Linux or WSL:

```bash
source .venv/bin/activate
```

### 3.2 Model-Specific Environments

Do not install incompatible model stacks into the default environment.

Use either:

- A disposable environment outside the repository, such as
  `~/.venvs/velora-catvton-<commit>`.
- A dedicated container in the later internal-worker phase.

Each model environment must have:

- Exact Python version
- Exact Git commit
- Locked direct and transitive dependencies
- PyTorch build and CUDA runtime selection
- Checkpoint hashes
- Host and GPU baseline

Delete obsolete environments rather than upgrading them in place. Recreate
from the lock when testing reproducibility.

## 4. Package Management

### 4.1 Recommendation: uv

Use `uv` as the preferred environment and dependency manager because it
supports Python selection, isolated virtual environments, dependency groups,
and a lockfile in one workflow.

When dependencies are approved, use:

- `pyproject.toml` for direct dependencies and groups
- `uv.lock` for resolved versions
- `uv sync` to reproduce the environment
- `uv run` to execute scripts without relying on shell activation

Do not create these files until the first model experiment has an approved,
minimal dependency set.

### 4.2 Fallback: pip

Use standard `venv` and `pip` only when `uv` cannot resolve a model's custom
build or upstream installation process.

The fallback must still:

- Use a dedicated virtual environment.
- Pin direct requirements.
- Record the PyTorch wheel index and CUDA build.
- Capture a reproducible resolved lock or constraints file.
- Avoid installing into system Python.

A raw `pip freeze` from an uncontrolled workstation is not an approved primary
dependency specification.

## 5. Planned Dependency Groups

The groups below define ownership boundaries. They are not an installation
list and contain no approved versions yet.

### 5.1 Base

Shared experiment infrastructure:

- Numerical array support
- Typed configuration and validation
- YAML or JSON configuration loading
- Progress reporting
- Structured logging
- Model artifact download client
- Test and static-quality tooling

The base group must not import a model or GPU framework.

### 5.2 Torch And CUDA

GPU execution foundation:

- `torch`
- `torchvision`
- Optional acceleration utilities required by an approved model

Install PyTorch from the official wheel source matching:

- Operating system
- Python version
- Selected CUDA runtime
- NVIDIA driver compatibility

Do not assume the locally installed CUDA toolkit controls the PyTorch runtime.
Pre-built PyTorch wheels normally provide their own CUDA runtime components.
A separate toolkit is needed only when compiling approved native extensions.

### 5.3 Image Processing

Deterministic local media handling:

- Image decoding and encoding
- Orientation correction
- Color-space normalization
- Resizing and format conversion
- Mask inspection
- Numerical image operations

Candidate packages may include Pillow, OpenCV, NumPy, and scikit-image.
The final set should be reduced to what the selected model actually needs.

Image-processing code must strip unnecessary metadata and must not copy private
media into caches, notebook output, or logs.

### 5.4 Notebooks

Interactive research only:

- JupyterLab
- IPython kernel support
- Plotting and local visual comparison

Notebook dependencies should remain optional. Notebooks must use the approved
environment kernel, clear embedded outputs before commit, and never embed
private images.

### 5.5 Model-Specific

Dependencies owned by one pinned model adapter:

- Diffusion or transformer libraries
- Model-specific preprocessing
- Pose, parsing, or mask-generation packages
- Custom CUDA or C++ extensions
- Exact Git dependencies

Model-specific packages must not move into `base` merely because multiple
experiments happen to use them. Git dependencies must reference an immutable
commit, not a branch.

## 6. GPU And CUDA Checks

Run host checks before creating or changing the Python environment.

### 6.1 NVIDIA Driver

```powershell
nvidia-smi
```

Record:

- GPU model
- Driver version
- Reported CUDA compatibility
- Total and available VRAM
- Other processes using the GPU

If native extensions will be compiled, also check:

```powershell
nvcc --version
```

`nvcc` is optional for pre-built PyTorch wheels and should not be installed
solely because `nvidia-smi` reports a CUDA version.

### 6.2 Python And Environment

```powershell
python --version
python -c "import sys; print(sys.executable); print(sys.version)"
```

The interpreter path must resolve to the intended virtual environment.

### 6.3 PyTorch GPU Access

After a future approved PyTorch installation:

```powershell
python -c "import torch; print('torch', torch.__version__); print('torch_cuda', torch.version.cuda); print('available', torch.cuda.is_available()); print('devices', torch.cuda.device_count())"
```

When CUDA is available:

```powershell
python -c "import torch; i=torch.cuda.current_device(); print(torch.cuda.get_device_name(i)); print(torch.cuda.get_device_capability(i)); print(torch.cuda.get_device_properties(i).total_memory)"
```

Minimal tensor check:

```powershell
python -c "import torch; x=torch.rand((1024,1024), device='cuda'); print(x.device, float(x.mean()))"
```

The environment is not GPU-ready unless `torch.cuda.is_available()` is `True`
and a tensor operation completes on the selected device.

## 7. CPU-Only Fallback

CPU mode is allowed only for:

- Import and configuration checks
- Unit tests that do not require model execution
- Image validation and preprocessing tests
- Notebook structure checks
- Very small model smoke tests when explicitly supported

CPU mode is not acceptable for:

- Virtual try-on quality acceptance
- Latency or throughput benchmarks
- VRAM and GPU-capacity planning
- Production-runtime estimates
- Full-resolution diffusion inference

Future inference commands must not silently fall back to CPU. They should fail
clearly when a GPU is required unless the operator explicitly selects a
CPU-only validation mode.

Expected CPU behavior:

- Model execution may be extremely slow or unsupported.
- Results must be labeled as functional checks, not performance evidence.
- CPU and GPU results must not be combined in the same benchmark summary.

## 8. Environment Acceptance Checklist

Before running a future model:

- [ ] Python resolves to the approved environment and version.
- [ ] Dependency lock matches the checked-out experiment revision.
- [ ] No packages are installed in system Python.
- [ ] `nvidia-smi` identifies the intended GPU and driver.
- [ ] PyTorch reports the expected build and CUDA runtime.
- [ ] CUDA availability and tensor checks pass.
- [ ] Model weights and datasets are outside Git tracking.
- [ ] Input and output directories follow the AI lab privacy rules.
- [ ] Model-specific licenses and artifact hashes are recorded.
- [ ] CPU fallback is disabled for GPU-required benchmarks.

## 9. Sources

- [Python version support](https://devguide.python.org/versions/)
- [uv documentation](https://docs.astral.sh/uv/)
- [uv environment documentation](https://docs.astral.sh/uv/pip/environments/)
- [PyTorch local installation and verification](https://pytorch.org/get-started/locally/)
- [Velora AI Lab Setup](../docs/AI_LAB_SETUP.md)

Commands and compatibility requirements must be re-verified when the first
model revision is selected.
