"""Research-only CatVTON direct inference wrapper.

This module intentionally delays CatVTON, Torch, Diffusers, and PIL imports
until inference execution so local validation can run without AI dependencies.
"""

from __future__ import annotations

import argparse
import importlib
import json
from collections.abc import Mapping, Sequence
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Literal, Protocol, cast

ClothType = Literal["upper", "lower", "overall"]
MixedPrecision = Literal["no", "fp16", "bf16"]

RESEARCH_ONLY_NOTICE = (
    "Research-only CatVTON runner. CatVTON public demo/weights are documented "
    "as non-commercial; do not use user images, production data, or generated "
    "outputs in Velora product flows."
)

VALID_CLOTH_TYPES: tuple[ClothType, ...] = ("upper", "lower", "overall")
VALID_MIXED_PRECISION: tuple[MixedPrecision, ...] = ("no", "fp16", "bf16")


class CatVTONResearchError(ValueError):
    """Raised when research inference configuration is invalid."""


class _TorchGenerator(Protocol):
    def manual_seed(self, seed: int) -> object:
        """Seed and return the generator."""


class _TorchModule(Protocol):
    float32: object
    float16: object
    bfloat16: object

    def Generator(self, *, device: str) -> _TorchGenerator:  # noqa: N802
        """Create a torch generator."""


class _ImageLike(Protocol):
    def convert(self, mode: str) -> _ImageLike:
        """Convert image mode."""

    def save(self, path: Path) -> None:
        """Save image to path."""


class _ImageModule(Protocol):
    def open(self, path: Path) -> _ImageLike:
        """Open an image from disk."""


class _SnapshotDownload(Protocol):
    def __call__(self, *, repo_id: str) -> str:
        """Download or resolve a Hugging Face snapshot."""


class _VaeImageProcessor(Protocol):
    def blur(self, mask: object, *, blur_factor: int) -> object:
        """Blur a mask."""


class _VaeImageProcessorFactory(Protocol):
    def __call__(
        self,
        *,
        vae_scale_factor: int,
        do_normalize: bool,
        do_binarize: bool,
        do_convert_grayscale: bool,
    ) -> _VaeImageProcessor:
        """Create a VAE image processor."""


class _AutoMasker(Protocol):
    def __call__(self, image: object, cloth_type: ClothType) -> Mapping[str, object]:
        """Generate mask data."""


class _AutoMaskerFactory(Protocol):
    def __call__(self, *, densepose_ckpt: str, schp_ckpt: str, device: str) -> _AutoMasker:
        """Create an automatic masker."""


class _CatVTONPipeline(Protocol):
    def __call__(
        self,
        *,
        image: object,
        condition_image: object,
        mask: object,
        num_inference_steps: int,
        guidance_scale: float,
        generator: object | None,
    ) -> Sequence[_ImageLike]:
        """Run CatVTON inference."""


class _CatVTONPipelineFactory(Protocol):
    def __call__(
        self,
        *,
        base_ckpt: str,
        attn_ckpt: str,
        attn_ckpt_version: str,
        weight_dtype: object,
        use_tf32: bool,
        device: str,
        skip_safety_check: bool,
    ) -> _CatVTONPipeline:
        """Create a CatVTON pipeline."""


class _ResizeImage(Protocol):
    def __call__(self, image: object, size: tuple[int, int]) -> _ImageLike:
        """Resize an image."""


@dataclass(frozen=True)
class _RuntimeSymbols:
    torch: _TorchModule
    image: _ImageModule
    snapshot_download: _SnapshotDownload
    vae_image_processor: _VaeImageProcessorFactory
    auto_masker: _AutoMaskerFactory
    pipeline: _CatVTONPipelineFactory
    resize_and_crop: _ResizeImage
    resize_and_padding: _ResizeImage


@dataclass(frozen=True)
class CatVTONResearchConfig:
    """Validated direct CatVTON inference configuration."""

    person_image_path: Path
    garment_image_path: Path
    cloth_type: ClothType
    output_path: Path
    seed: int
    inference_steps: int
    guidance_scale: float
    base_model_path: str = "runwayml/stable-diffusion-inpainting"
    resume_path: str = "zhengchong/CatVTON"
    width: int = 768
    height: int = 1024
    mixed_precision: MixedPrecision = "fp16"
    device: str = "cuda"
    allow_tf32: bool = True
    skip_safety_check: bool = False


@dataclass(frozen=True)
class CatVTONResearchResult:
    """Direct inference result metadata."""

    output_path: Path
    mask_generated: bool
    seed: int
    inference_steps: int
    guidance_scale: float
    width: int
    height: int
    device: str
    research_only: bool = True


def _validate_positive_int(value: int, field_name: str) -> None:
    if value <= 0:
        raise CatVTONResearchError(f"{field_name} must be greater than zero.")


def _validate_positive_float(value: float, field_name: str) -> None:
    if value <= 0:
        raise CatVTONResearchError(f"{field_name} must be greater than zero.")


def _validate_image_path(path: Path, field_name: str) -> None:
    if not path.exists():
        raise CatVTONResearchError(f"{field_name} does not exist: {path}")
    if not path.is_file():
        raise CatVTONResearchError(f"{field_name} must be a file: {path}")


def validate_config(config: CatVTONResearchConfig) -> CatVTONResearchConfig:
    """Validate direct inference config without importing or loading CatVTON."""
    _validate_image_path(config.person_image_path, "person_image_path")
    _validate_image_path(config.garment_image_path, "garment_image_path")

    if config.cloth_type not in VALID_CLOTH_TYPES:
        raise CatVTONResearchError("cloth_type must be one of upper, lower, or overall.")

    if config.mixed_precision not in VALID_MIXED_PRECISION:
        raise CatVTONResearchError("mixed_precision must be one of no, fp16, or bf16.")

    _validate_positive_int(config.inference_steps, "inference_steps")
    _validate_positive_float(config.guidance_scale, "guidance_scale")
    _validate_positive_int(config.width, "width")
    _validate_positive_int(config.height, "height")

    if config.width % 8 != 0 or config.height % 8 != 0:
        raise CatVTONResearchError("width and height must be divisible by 8.")

    if config.seed < -1:
        raise CatVTONResearchError("seed must be -1 or greater.")

    if not config.base_model_path.strip():
        raise CatVTONResearchError("base_model_path is required.")

    if not config.resume_path.strip():
        raise CatVTONResearchError("resume_path is required.")

    if not config.device.strip():
        raise CatVTONResearchError("device is required.")

    if config.output_path.exists() and config.output_path.is_dir():
        raise CatVTONResearchError("output_path must be a file path, not a directory.")

    return config


def build_parser() -> argparse.ArgumentParser:
    """Create CLI parser for direct research inference."""
    parser = argparse.ArgumentParser(
        prog="python -m src.providers.catvton_research",
        description="Run one research-only CatVTON try-on request.",
    )
    parser.add_argument("--person", type=Path, required=True, help="Person image path.")
    parser.add_argument("--garment", type=Path, required=True, help="Garment image path.")
    parser.add_argument(
        "--cloth-type",
        choices=VALID_CLOTH_TYPES,
        required=True,
        help="Garment region for automatic masking.",
    )
    parser.add_argument("--output", type=Path, required=True, help="Generated output path.")
    parser.add_argument("--seed", type=int, default=42, help="Seed. Use -1 for unseeded.")
    parser.add_argument("--inference-steps", type=int, default=50)
    parser.add_argument("--guidance-scale", type=float, default=2.5)
    parser.add_argument("--base-model-path", default="runwayml/stable-diffusion-inpainting")
    parser.add_argument("--resume-path", default="zhengchong/CatVTON")
    parser.add_argument("--width", type=int, default=768)
    parser.add_argument("--height", type=int, default=1024)
    parser.add_argument("--mixed-precision", choices=VALID_MIXED_PRECISION, default="fp16")
    parser.add_argument("--device", default="cuda")
    parser.add_argument("--no-tf32", action="store_true", help="Disable TF32 where supported.")
    parser.add_argument(
        "--skip-safety-check",
        action="store_true",
        help="Pass skip_safety_check=True into CatVTONPipeline.",
    )
    return parser


def config_from_args(args: argparse.Namespace) -> CatVTONResearchConfig:
    """Build and validate config from parsed CLI arguments."""
    cloth_type = cast(ClothType, args.cloth_type)
    mixed_precision = cast(MixedPrecision, args.mixed_precision)
    config = CatVTONResearchConfig(
        person_image_path=args.person,
        garment_image_path=args.garment,
        cloth_type=cloth_type,
        output_path=args.output,
        seed=args.seed,
        inference_steps=args.inference_steps,
        guidance_scale=args.guidance_scale,
        base_model_path=args.base_model_path,
        resume_path=args.resume_path,
        width=args.width,
        height=args.height,
        mixed_precision=mixed_precision,
        device=args.device,
        allow_tf32=not args.no_tf32,
        skip_safety_check=args.skip_safety_check,
    )
    return validate_config(config)


def _weight_dtype(torch_module: _TorchModule, mixed_precision: MixedPrecision) -> object:
    if mixed_precision == "no":
        return torch_module.float32
    if mixed_precision == "fp16":
        return torch_module.float16
    return torch_module.bfloat16


def _load_runtime_symbols() -> _RuntimeSymbols:
    """Load heavyweight CatVTON runtime symbols only during execution."""
    torch_module = cast(_TorchModule, importlib.import_module("torch"))
    image_module = cast(_ImageModule, importlib.import_module("PIL.Image"))
    hub_module = importlib.import_module("huggingface_hub")
    diffusers_image_processor = importlib.import_module("diffusers.image_processor")
    cloth_masker_module = importlib.import_module("model.cloth_masker")
    pipeline_module = importlib.import_module("model.pipeline")
    utils_module = importlib.import_module("utils")

    return _RuntimeSymbols(
        torch=torch_module,
        image=image_module,
        snapshot_download=cast(_SnapshotDownload, hub_module.__dict__["snapshot_download"]),
        vae_image_processor=cast(
            _VaeImageProcessorFactory,
            diffusers_image_processor.__dict__["VaeImageProcessor"],
        ),
        auto_masker=cast(_AutoMaskerFactory, cloth_masker_module.__dict__["AutoMasker"]),
        pipeline=cast(_CatVTONPipelineFactory, pipeline_module.__dict__["CatVTONPipeline"]),
        resize_and_crop=cast(_ResizeImage, utils_module.__dict__["resize_and_crop"]),
        resize_and_padding=cast(_ResizeImage, utils_module.__dict__["resize_and_padding"]),
    )


def run_direct_inference(config: CatVTONResearchConfig) -> CatVTONResearchResult:
    """Run one research-only CatVTON request and save the generated image."""
    config = validate_config(config)
    runtime = _load_runtime_symbols()

    repo_path = runtime.snapshot_download(repo_id=config.resume_path)
    weight_dtype = _weight_dtype(runtime.torch, config.mixed_precision)

    pipeline = runtime.pipeline(
        base_ckpt=config.base_model_path,
        attn_ckpt=repo_path,
        attn_ckpt_version="mix",
        weight_dtype=weight_dtype,
        use_tf32=config.allow_tf32,
        device=config.device,
        skip_safety_check=config.skip_safety_check,
    )
    mask_processor = runtime.vae_image_processor(
        vae_scale_factor=8,
        do_normalize=False,
        do_binarize=True,
        do_convert_grayscale=True,
    )
    automasker = runtime.auto_masker(
        densepose_ckpt=str(Path(repo_path) / "DensePose"),
        schp_ckpt=str(Path(repo_path) / "SCHP"),
        device=config.device,
    )

    generator = None
    if config.seed != -1:
        generator = runtime.torch.Generator(device=config.device).manual_seed(config.seed)

    person_image = runtime.image.open(config.person_image_path).convert("RGB")
    garment_image = runtime.image.open(config.garment_image_path).convert("RGB")
    person_image = runtime.resize_and_crop(person_image, (config.width, config.height))
    garment_image = runtime.resize_and_padding(garment_image, (config.width, config.height))

    mask = automasker(person_image, config.cloth_type)["mask"]
    mask = mask_processor.blur(mask, blur_factor=9)

    result_image = pipeline(
        image=person_image,
        condition_image=garment_image,
        mask=mask,
        num_inference_steps=config.inference_steps,
        guidance_scale=config.guidance_scale,
        generator=generator,
    )[0]

    config.output_path.parent.mkdir(parents=True, exist_ok=True)
    result_image.save(config.output_path)
    return CatVTONResearchResult(
        output_path=config.output_path,
        mask_generated=True,
        seed=config.seed,
        inference_steps=config.inference_steps,
        guidance_scale=config.guidance_scale,
        width=config.width,
        height=config.height,
        device=config.device,
    )


def main(argv: list[str] | None = None) -> int:
    """Execute direct research inference from CLI args."""
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        config = config_from_args(args)
    except CatVTONResearchError as error:
        parser.error(str(error))

    print(RESEARCH_ONLY_NOTICE)
    result = run_direct_inference(config)
    payload = asdict(result)
    payload["output_path"] = str(result.output_path)
    print(json.dumps(payload, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
