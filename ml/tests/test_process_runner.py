"""Smoke tests for bounded local process execution."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

from src.runner.process import ProcessRequest, run_process


class ProcessRunnerTests(unittest.TestCase):
    """Verify local process capture and timeout behavior."""

    def test_captures_stdout_stderr_and_nonzero_exit_code(self) -> None:
        result = run_process(
            ProcessRequest(
                args=(
                    sys.executable,
                    "-c",
                    (
                        "import sys; "
                        "print('standard-output'); "
                        "print('standard-error', file=sys.stderr); "
                        "raise SystemExit(3)"
                    ),
                ),
            )
        )

        self.assertEqual(result.stdout.strip(), "standard-output")
        self.assertEqual(result.stderr.strip(), "standard-error")
        self.assertEqual(result.exit_code, 3)
        self.assertFalse(result.timed_out)
        self.assertGreaterEqual(result.completed_at, result.started_at)
        self.assertGreaterEqual(result.duration_ms, 0)

    def test_applies_cwd_and_environment_overrides(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            cwd = Path(temporary_directory)
            result = run_process(
                ProcessRequest(
                    args=(
                        sys.executable,
                        "-c",
                        (
                            "import os; "
                            "from pathlib import Path; "
                            "print(Path.cwd()); "
                            "print(os.environ['VELORA_PROCESS_TEST'])"
                        ),
                    ),
                    cwd=cwd,
                    env_overrides={"VELORA_PROCESS_TEST": "configured"},
                )
            )

        output_lines = result.stdout.splitlines()
        self.assertEqual(Path(output_lines[0]), cwd)
        self.assertEqual(output_lines[1], "configured")
        self.assertEqual(result.exit_code, 0)
        self.assertFalse(result.timed_out)

    def test_returns_timeout_result(self) -> None:
        result = run_process(
            ProcessRequest(
                args=(
                    sys.executable,
                    "-c",
                    "import time; time.sleep(5)",
                ),
                timeout_seconds=0.1,
            )
        )

        self.assertTrue(result.timed_out)
        self.assertIsNone(result.exit_code)
        self.assertLess(result.duration_ms, 5000)

    def test_rejects_invalid_request(self) -> None:
        with self.assertRaisesRegex(ValueError, "args must not be empty"):
            run_process(ProcessRequest(args=()))

        with self.assertRaisesRegex(ValueError, "greater than zero"):
            run_process(
                ProcessRequest(
                    args=(sys.executable, "--version"),
                    timeout_seconds=0,
                )
            )


if __name__ == "__main__":
    unittest.main()
