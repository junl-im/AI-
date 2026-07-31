import unicodedata
from pathlib import Path

API_ROOT = Path(__file__).resolve().parents[1]


def _ruff_display_width(line: str) -> int:
    return sum(
        2 if unicodedata.east_asian_width(character) in {"W", "F"} else 1
        for character in line
    )


def test_python_310_does_not_use_datetime_utc_constant():
    offenders: list[str] = []
    for path in (API_ROOT / "app").rglob("*.py"):
        source = path.read_text(encoding="utf-8")
        if "from datetime import UTC" in source or "datetime.UTC" in source:
            offenders.append(str(path.relative_to(API_ROOT)))

    assert offenders == []


def test_ruff_keeps_timezone_utc_for_python_310():
    config = (API_ROOT / "pyproject.toml").read_text(encoding="utf-8")

    assert 'target-version = "py310"' in config
    assert 'ignore = ["UP017"]' in config


def test_python_lines_fit_ruff_display_width():
    offenders: list[str] = []
    for source_root in (API_ROOT / "app", API_ROOT / "tests"):
        for path in source_root.rglob("*.py"):
            for line_number, line in enumerate(
                path.read_text(encoding="utf-8").splitlines(),
                start=1,
            ):
                width = _ruff_display_width(line)
                if width > 100:
                    relative_path = path.relative_to(API_ROOT)
                    offenders.append(f"{relative_path}:{line_number}:{width}")

    assert offenders == []


def test_python_310_catches_asyncio_timeout_error():
    source = (
        API_ROOT / "app" / "services" / "job_manager.py"
    ).read_text(encoding="utf-8")

    assert "except asyncio.TimeoutError as error:" in source
    assert "except TimeoutError as error:" not in source
