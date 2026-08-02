import hashlib
import json
from pathlib import Path

import pytest

from app.config import WorkerSettings
from app.model_manifest import ModelManifestError, load_model_manifest, verify_model_manifest
from app.runtime import CosyVoiceRuntime


def write_manifest(
    tmp_path: Path,
    model_path: Path,
    *,
    requires_acceptance: bool = True,
) -> Path:
    model_file = model_path / "model.bin"
    digest = hashlib.sha256(model_file.read_bytes()).hexdigest()
    manifest = tmp_path / "model-manifest.json"
    manifest.write_text(
        json.dumps(
            {
                "schema_version": 1,
                "model_id": "test-cosyvoice",
                "model_version": "1.0",
                "license": {
                    "name": "Test License",
                    "url": "https://example.invalid/license",
                    "requires_acceptance": requires_acceptance,
                },
                "files": [
                    {
                        "path": "model.bin",
                        "size_bytes": model_file.stat().st_size,
                        "sha256": digest,
                    }
                ],
            }
        ),
        encoding="utf-8",
    )
    return manifest


def test_manifest_verifies_checksum_after_license_acceptance(tmp_path: Path):
    model_path = tmp_path / "model"
    model_path.mkdir()
    (model_path / "model.bin").write_bytes(b"verified-model")
    manifest = write_manifest(tmp_path, model_path)

    result = verify_model_manifest(model_path, manifest, license_accepted=True)

    assert result.state == "verified"
    assert result.checksum_verified is True
    assert result.verified_file_count == 1
    assert result.model_id == "test-cosyvoice"


def test_manifest_blocks_before_license_acceptance(tmp_path: Path):
    model_path = tmp_path / "model"
    model_path.mkdir()
    (model_path / "model.bin").write_bytes(b"verified-model")
    manifest = write_manifest(tmp_path, model_path)

    result = verify_model_manifest(model_path, manifest, license_accepted=False)

    assert result.state == "license-required"
    assert result.checksum_verified is False
    assert "동의" in result.reason


def test_manifest_detects_tampered_model_file(tmp_path: Path):
    model_path = tmp_path / "model"
    model_path.mkdir()
    model_file = model_path / "model.bin"
    model_file.write_bytes(b"verified-model")
    manifest = write_manifest(tmp_path, model_path, requires_acceptance=False)
    model_file.write_bytes(b"tampered-model")

    result = verify_model_manifest(model_path, manifest, license_accepted=False)

    assert result.state == "checksum-failed"
    assert any("불일치" in failure for failure in result.checksum_failures)


def test_manifest_rejects_parent_directory_paths(tmp_path: Path):
    manifest = tmp_path / "unsafe.json"
    manifest.write_text(
        json.dumps(
            {
                "schema_version": 1,
                "model_id": "unsafe",
                "model_version": "1",
                "license": {
                    "name": "Test",
                    "requires_acceptance": False,
                },
                "files": [{"path": "../secret", "sha256": "0" * 64}],
            }
        ),
        encoding="utf-8",
    )

    with pytest.raises(ModelManifestError):
        load_model_manifest(manifest)


def test_runtime_requires_manifest_before_adapter_loading(tmp_path: Path):
    model_path = tmp_path / "model"
    model_path.mkdir()
    settings = WorkerSettings(
        output_path=tmp_path / "output",
        model_path=model_path,
        adapter_module="missing.adapter",
        allow_cpu=True,
    )

    diagnostics = CosyVoiceRuntime(settings).diagnostics()

    assert diagnostics.ready is False
    assert diagnostics.model_install_state == "manifest-required"
    assert "MODEL_MANIFEST_PATH" in diagnostics.reason
    assert diagnostics.adapter_loaded is False
