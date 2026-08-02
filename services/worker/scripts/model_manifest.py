import argparse
import hashlib
import json
import sys
from pathlib import Path

WORKER_ROOT = Path(__file__).resolve().parents[1]
if str(WORKER_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKER_ROOT))

from app.model_manifest import verify_model_manifest  # noqa: E402


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        while chunk := source.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def model_files(model_path: Path, selected: list[str]) -> list[Path]:
    if selected:
        files = [model_path / value for value in selected]
    else:
        files = [path for path in model_path.rglob("*") if path.is_file()]
    resolved_root = model_path.resolve()
    valid: list[Path] = []
    for path in files:
        resolved = path.resolve()
        if not resolved.is_relative_to(resolved_root):
            raise ValueError(f"모델 루트 밖 파일은 포함할 수 없습니다: {path}")
        if not resolved.is_file():
            raise ValueError(f"모델 파일을 찾을 수 없습니다: {path}")
        valid.append(resolved)
    return sorted(set(valid))


def create_manifest(args: argparse.Namespace) -> int:
    model_path = args.model_path.resolve()
    if not model_path.is_dir():
        raise ValueError(f"모델 경로를 찾을 수 없습니다: {model_path}")
    output = args.output.resolve()
    files = [path for path in model_files(model_path, args.file) if path != output]
    if not files:
        raise ValueError("매니페스트에 포함할 모델 파일이 없습니다.")
    payload = {
        "schema_version": 1,
        "model_id": args.model_id,
        "model_version": args.model_version,
        "license": {
            "name": args.license_name,
            "url": args.license_url,
            "requires_acceptance": not args.no_license_acceptance,
        },
        "files": [
            {
                "path": path.relative_to(model_path).as_posix(),
                "size_bytes": path.stat().st_size,
                "sha256": sha256(path),
            }
            for path in files
        ],
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"매니페스트 생성 완료: {output} ({len(files)} files)")
    return 0


def verify_manifest(args: argparse.Namespace) -> int:
    result = verify_model_manifest(
        args.model_path,
        args.manifest,
        license_accepted=args.accept_license,
    )
    print(json.dumps(result.as_dict(), ensure_ascii=False, indent=2))
    return 0 if result.checksum_verified else 1


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description="SoriON 모델 매니페스트 생성·검증")
    subparsers = root.add_subparsers(dest="command", required=True)

    create = subparsers.add_parser("create", help="로컬 모델 파일의 SHA-256 매니페스트 생성")
    create.add_argument("--model-path", type=Path, required=True)
    create.add_argument("--output", type=Path, required=True)
    create.add_argument("--model-id", required=True)
    create.add_argument("--model-version", required=True)
    create.add_argument("--license-name", required=True)
    create.add_argument("--license-url")
    create.add_argument("--no-license-acceptance", action="store_true")
    create.add_argument(
        "--file",
        action="append",
        default=[],
        help="모델 루트 기준 포함 파일. 생략하면 모든 파일을 포함합니다.",
    )
    create.set_defaults(handler=create_manifest)

    verify = subparsers.add_parser("verify", help="매니페스트와 로컬 모델 파일 검증")
    verify.add_argument("--model-path", type=Path, required=True)
    verify.add_argument("--manifest", type=Path, required=True)
    verify.add_argument("--accept-license", action="store_true")
    verify.set_defaults(handler=verify_manifest)
    return root


def main() -> int:
    args = parser().parse_args()
    try:
        return args.handler(args)
    except (OSError, ValueError) as error:
        print(f"오류: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
