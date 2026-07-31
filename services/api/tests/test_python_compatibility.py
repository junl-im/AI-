from pathlib import Path


API_ROOT = Path(__file__).resolve().parents[1]


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
