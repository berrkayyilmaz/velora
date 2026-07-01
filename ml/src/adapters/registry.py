"""Model adapter registry."""

from __future__ import annotations

from src.adapters.base import ModelAdapter
from src.adapters.dummy import DummyModelAdapter


class AdapterRegistry:
    """Store model adapters by stable identifier."""

    def __init__(self) -> None:
        self._adapters: dict[str, ModelAdapter] = {}

    def register(self, adapter: ModelAdapter) -> None:
        """Register one adapter and reject duplicate identifiers."""
        if adapter.adapter_id in self._adapters:
            raise ValueError(f"Adapter is already registered: {adapter.adapter_id}")
        self._adapters[adapter.adapter_id] = adapter

    def get(self, adapter_id: str) -> ModelAdapter:
        """Return a registered adapter."""
        try:
            return self._adapters[adapter_id]
        except KeyError as error:
            raise ValueError(f"Adapter is not registered: {adapter_id}") from error

    def available(self) -> tuple[str, ...]:
        """Return registered adapter identifiers in stable order."""
        return tuple(sorted(self._adapters))


def create_adapter_registry() -> AdapterRegistry:
    """Create the model adapter registry available to local providers."""
    registry = AdapterRegistry()
    registry.register(DummyModelAdapter())
    return registry
