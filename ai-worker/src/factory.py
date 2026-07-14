"""Executor factory for the AI worker."""

from __future__ import annotations

from src.catvton_executor import CatVTONResearchExecutor
from src.config import WorkerConfig
from src.executor import FakeInferenceExecutor, InferenceExecutor


def create_executor(config: WorkerConfig) -> InferenceExecutor:
    """Create the configured inference executor."""

    if config.executor_mode == "fake":
        return FakeInferenceExecutor()

    return CatVTONResearchExecutor(config.catvton)
