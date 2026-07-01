"""Abstract model adapter contract."""

from __future__ import annotations

from abc import ABC, abstractmethod

from src.adapters.models import ModelRequest, ModelResult


class ModelAdapter(ABC):
    """Execute one model-neutral request."""

    @property
    @abstractmethod
    def adapter_id(self) -> str:
        """Return the stable adapter identifier."""

    @property
    @abstractmethod
    def adapter_version(self) -> str:
        """Return the adapter implementation version."""

    @abstractmethod
    def execute(self, request: ModelRequest) -> ModelResult:
        """Execute a model request and return a normalized result."""
