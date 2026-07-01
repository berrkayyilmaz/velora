"""Abstract provider contract."""

from __future__ import annotations

from abc import ABC, abstractmethod

from src.providers.models import ProviderRequest, ProviderResult


class Provider(ABC):
    """Execute one normalized provider request."""

    @property
    @abstractmethod
    def provider_id(self) -> str:
        """Return the stable provider identifier."""

    @property
    @abstractmethod
    def provider_version(self) -> str:
        """Return the provider adapter version."""

    @abstractmethod
    def execute(self, request: ProviderRequest) -> ProviderResult:
        """Execute a request and return a normalized result."""
