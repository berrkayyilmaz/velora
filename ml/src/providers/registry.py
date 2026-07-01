"""Provider registry."""

from __future__ import annotations

from src.providers.base import Provider
from src.providers.dummy import DummyProvider


class ProviderRegistry:
    """Store provider implementations by stable identifier."""

    def __init__(self) -> None:
        self._providers: dict[str, Provider] = {}

    def register(self, provider: Provider) -> None:
        """Register one provider and reject duplicate identifiers."""
        if provider.provider_id in self._providers:
            raise ValueError(f"Provider is already registered: {provider.provider_id}")
        self._providers[provider.provider_id] = provider

    def get(self, provider_id: str) -> Provider:
        """Return a registered provider."""
        try:
            return self._providers[provider_id]
        except KeyError as error:
            raise ValueError(f"Provider is not registered: {provider_id}") from error

    def available(self) -> tuple[str, ...]:
        """Return registered provider identifiers in stable order."""
        return tuple(sorted(self._providers))


def create_provider_registry() -> ProviderRegistry:
    """Create the provider registry available to the local CLI."""
    registry = ProviderRegistry()
    registry.register(DummyProvider())
    return registry
