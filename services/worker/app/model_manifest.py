import hashlib
import json
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Any

_SHA256_HEX_LENGTH = 64
_READ_CHUNK_BYTES = 1024 * 1024


class ModelManifestError(ValueError):
    pass


@dataclass(frozen=True)
class ModelFileSpec:
    path: str
    sha256: str
    size_bytes: int | None = None


@dataclass(frozen=True)
class ModelManifest:
    schema_version: int
    model_id: str
    model_version: str
    license_name: str
    license_url: str | None
    license_requires_acceptance: bool
    files: tuple[ModelFileSpec, ...]

    @property
    def declared_total_bytes(self) -> int | None:
        sizes = [item.size_bytes for item in self.files]
        if any(size is None for size in sizes):
            return None
        return sum(size for size in sizes if size is not None)


@dataclass(frozen=True)
class ModelVerification:
    state: str
    reason: str
    manifest_path: str | None = None
    manifest_exists: bool = False
    manifest_valid: bool = False
    model_id: str | None = None
    model_version: str | None = None
    model_digest: str | None = None
    license_name: str | None = None
    license_url: str | None = None
    license_requires_acceptance: bool = False
    license_accepted: bool = False
    checksum_verified: bool = False
    checksum_failures: tuple[str, ...] = ()
    declared_file_count: int = 0
    verified_file_count: int = 0
    declared_total_bytes: int | None = None

    def as_dict(self) -> dict[str, object]:
        return {
            "state": self.state,
            "reason": self.reason,
            "manifest_path": self.manifest_path,
            "manifest_exists": self.manifest_exists,
            "manifest_valid": self.manifest_valid,
            "model_id": self.model_id,
            "model_version": self.model_version,
            "model_digest": self.model_digest,
            "license_name": self.license_name,
            "license_url": self.license_url,
            "license_requires_acceptance": self.license_requires_acceptance,
            "license_accepted": self.license_accepted,
            "checksum_verified": self.checksum_verified,
            "checksum_failures": list(self.checksum_failures),
            "declared_file_count": self.declared_file_count,
            "verified_file_count": self.verified_file_count,
            "declared_total_bytes": self.declared_total_bytes,
        }


HashCache = dict[str, tuple[int, int, str]]


def _required_text(value: Any, field_name: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ModelManifestError(f"{field_name}은 비어 있지 않은 문자열이어야 합니다.")
    return value.strip()


def _optional_text(value: Any, field_name: str) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise ModelManifestError(f"{field_name}은 문자열이어야 합니다.")
    return value.strip() or None


def _safe_relative_path(value: Any) -> str:
    text = _required_text(value, "files[].path")
    path = PurePosixPath(text)
    if path.is_absolute() or ".." in path.parts or "." in path.parts:
        raise ModelManifestError(f"안전하지 않은 모델 파일 경로입니다: {text}")
    if "\\" in text:
        raise ModelManifestError("모델 파일 경로는 / 구분자를 사용해야 합니다.")
    return path.as_posix()


def _parse_file(value: Any) -> ModelFileSpec:
    if not isinstance(value, dict):
        raise ModelManifestError("files 항목은 객체여야 합니다.")
    relative_path = _safe_relative_path(value.get("path"))
    digest = _required_text(value.get("sha256"), "files[].sha256").lower()
    valid_digest = len(digest) == _SHA256_HEX_LENGTH and all(
        character in "0123456789abcdef" for character in digest
    )
    if not valid_digest:
        raise ModelManifestError(f"SHA-256 형식이 올바르지 않습니다: {relative_path}")
    size = value.get("size_bytes")
    if size is not None and (not isinstance(size, int) or isinstance(size, bool) or size < 0):
        raise ModelManifestError(f"size_bytes가 올바르지 않습니다: {relative_path}")
    return ModelFileSpec(path=relative_path, sha256=digest, size_bytes=size)


def load_model_manifest(path: Path) -> ModelManifest:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except OSError as error:
        raise ModelManifestError(f"모델 매니페스트를 읽지 못했습니다: {error}") from error
    except json.JSONDecodeError as error:
        raise ModelManifestError(f"모델 매니페스트 JSON이 올바르지 않습니다: {error}") from error
    if not isinstance(payload, dict):
        raise ModelManifestError("모델 매니페스트 루트는 객체여야 합니다.")
    schema_version = payload.get("schema_version")
    if schema_version != 1:
        raise ModelManifestError("지원하는 모델 매니페스트 schema_version은 1입니다.")
    license_payload = payload.get("license")
    if not isinstance(license_payload, dict):
        raise ModelManifestError("license 객체가 필요합니다.")
    requires_acceptance = license_payload.get("requires_acceptance")
    if not isinstance(requires_acceptance, bool):
        raise ModelManifestError("license.requires_acceptance는 boolean이어야 합니다.")
    raw_files = payload.get("files")
    if not isinstance(raw_files, list) or not raw_files:
        raise ModelManifestError("files에는 한 개 이상의 모델 파일이 필요합니다.")
    files = tuple(_parse_file(item) for item in raw_files)
    file_paths = [item.path for item in files]
    if len(set(file_paths)) != len(file_paths):
        raise ModelManifestError("files에 중복 경로가 있습니다.")
    return ModelManifest(
        schema_version=1,
        model_id=_required_text(payload.get("model_id"), "model_id"),
        model_version=_required_text(payload.get("model_version"), "model_version"),
        license_name=_required_text(license_payload.get("name"), "license.name"),
        license_url=_optional_text(license_payload.get("url"), "license.url"),
        license_requires_acceptance=requires_acceptance,
        files=files,
    )


def _sha256(path: Path, cache: HashCache | None) -> str:
    stat = path.stat()
    cache_key = str(path)
    cached = cache.get(cache_key) if cache is not None else None
    if cached and cached[0] == stat.st_size and cached[1] == stat.st_mtime_ns:
        return cached[2]
    digest = hashlib.sha256()
    with path.open("rb") as source:
        while chunk := source.read(_READ_CHUNK_BYTES):
            digest.update(chunk)
    value = digest.hexdigest()
    if cache is not None:
        cache[cache_key] = (stat.st_size, stat.st_mtime_ns, value)
    return value


def verify_model_manifest(
    model_path: Path | None,
    manifest_path: Path | None,
    license_accepted: bool,
    hash_cache: HashCache | None = None,
) -> ModelVerification:
    if manifest_path is None:
        return ModelVerification(
            state="not-configured",
            reason="모델 무결성 매니페스트가 설정되지 않았습니다.",
            license_accepted=license_accepted,
        )
    manifest_text = str(manifest_path)
    if not manifest_path.is_file():
        return ModelVerification(
            state="manifest-missing",
            reason=f"모델 매니페스트를 찾을 수 없습니다: {manifest_path}",
            manifest_path=manifest_text,
            license_accepted=license_accepted,
        )
    try:
        manifest = load_model_manifest(manifest_path)
    except ModelManifestError as error:
        return ModelVerification(
            state="manifest-invalid",
            reason=str(error),
            manifest_path=manifest_text,
            manifest_exists=True,
            license_accepted=license_accepted,
        )
    base = {
        "manifest_path": manifest_text,
        "manifest_exists": True,
        "manifest_valid": True,
        "model_id": manifest.model_id,
        "model_version": manifest.model_version,
        "model_digest": _sha256(manifest_path, hash_cache),
        "license_name": manifest.license_name,
        "license_url": manifest.license_url,
        "license_requires_acceptance": manifest.license_requires_acceptance,
        "license_accepted": license_accepted,
        "declared_file_count": len(manifest.files),
        "declared_total_bytes": manifest.declared_total_bytes,
    }
    if manifest.license_requires_acceptance and not license_accepted:
        return ModelVerification(
            state="license-required",
            reason=f"{manifest.license_name} 모델 라이선스 동의가 필요합니다.",
            **base,
        )
    if model_path is None:
        return ModelVerification(
            state="model-path-required",
            reason="SORION_WORKER_MODEL_PATH가 필요합니다.",
            **base,
        )
    if not model_path.is_dir():
        return ModelVerification(
            state="model-path-missing",
            reason=f"모델 경로를 찾을 수 없습니다: {model_path}",
            **base,
        )
    root = model_path.resolve()
    failures: list[str] = []
    verified_count = 0
    for item in manifest.files:
        candidate = (model_path / item.path).resolve()
        if not candidate.is_relative_to(root):
            failures.append(f"모델 루트 밖 경로: {item.path}")
            continue
        if not candidate.is_file():
            failures.append(f"파일 없음: {item.path}")
            continue
        try:
            stat = candidate.stat()
            if item.size_bytes is not None and stat.st_size != item.size_bytes:
                failures.append(
                    f"크기 불일치: {item.path} ({stat.st_size} != {item.size_bytes})"
                )
                continue
            actual_digest = _sha256(candidate, hash_cache)
        except OSError as error:
            failures.append(f"파일 확인 실패: {item.path} ({error})")
            continue
        if actual_digest != item.sha256:
            failures.append(f"SHA-256 불일치: {item.path}")
            continue
        verified_count += 1
    if failures:
        return ModelVerification(
            state="checksum-failed",
            reason="모델 파일 무결성 검증에 실패했습니다.",
            checksum_failures=tuple(failures),
            verified_file_count=verified_count,
            **base,
        )
    return ModelVerification(
        state="verified",
        reason=(
            f"{manifest.model_id} {manifest.model_version} 모델 파일 "
            f"{verified_count}개의 SHA-256을 확인했습니다."
        ),
        checksum_verified=True,
        verified_file_count=verified_count,
        **base,
    )
