"""Model adapter contracts and local implementations."""

from src.adapters.base import ModelAdapter
from src.adapters.models import ModelRequest, ModelResult
from src.adapters.registry import AdapterRegistry, create_adapter_registry

__all__ = [
    "AdapterRegistry",
    "ModelAdapter",
    "ModelRequest",
    "ModelResult",
    "create_adapter_registry",
]
