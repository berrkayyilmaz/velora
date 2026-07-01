"""Typed local process execution with bounded runtime."""

from __future__ import annotations

import os
import subprocess
import time
from collections.abc import Mapping
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import TypedDict


class ProcessResultPayload(TypedDict):
    """JSON-serializable local process result schema."""

    stdout: str
    stderr: str
    exitCode: int | None
    startedAt: str
    completedAt: str
    durationMs: float
    timedOut: bool


@dataclass(frozen=True, slots=True)
class ProcessRequest:
    """Configuration for one shell-free local process."""

    args: tuple[str, ...]
    cwd: Path | None = None
    env_overrides: Mapping[str, str] = field(default_factory=dict)
    timeout_seconds: float = 30.0


@dataclass(frozen=True, slots=True)
class ProcessResult:
    """Captured outcome of one local process."""

    stdout: str
    stderr: str
    exit_code: int | None
    started_at: datetime
    completed_at: datetime
    duration_ms: float
    timed_out: bool

    def to_payload(self) -> ProcessResultPayload:
        """Return the camelCase process result schema."""
        return {
            "stdout": self.stdout,
            "stderr": self.stderr,
            "exitCode": self.exit_code,
            "startedAt": self.started_at.isoformat(),
            "completedAt": self.completed_at.isoformat(),
            "durationMs": self.duration_ms,
            "timedOut": self.timed_out,
        }


def _captured_text(value: bytes | str | None) -> str:
    if value is None:
        return ""
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return value


def run_process(request: ProcessRequest) -> ProcessResult:
    """Run one local command and safely capture timeout as a result."""
    if not request.args:
        raise ValueError("Process args must not be empty")
    if request.timeout_seconds <= 0:
        raise ValueError("Process timeout_seconds must be greater than zero")

    environment = os.environ.copy()
    environment.update(request.env_overrides)
    started_at = datetime.now(UTC)
    started_clock = time.perf_counter()

    try:
        completed_process = subprocess.run(
            request.args,
            cwd=request.cwd,
            env=environment,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=request.timeout_seconds,
            check=False,
            shell=False,
        )
        stdout = completed_process.stdout
        stderr = completed_process.stderr
        exit_code: int | None = completed_process.returncode
        timed_out = False
    except subprocess.TimeoutExpired as error:
        stdout = _captured_text(error.stdout)
        stderr = _captured_text(error.stderr)
        exit_code = None
        timed_out = True

    completed_at = datetime.now(UTC)
    return ProcessResult(
        stdout=stdout,
        stderr=stderr,
        exit_code=exit_code,
        started_at=started_at,
        completed_at=completed_at,
        duration_ms=round((time.perf_counter() - started_clock) * 1000, 3),
        timed_out=timed_out,
    )
