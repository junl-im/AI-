from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import FileResponse

router = APIRouter()


@router.get("/{filename}", name="get_audio_file")
async def get_audio_file(filename: str, request: Request) -> FileResponse:
    store = request.app.state.audio_store
    store.cleanup_expired()
    path = store.resolve(filename)
    if path is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SOA-4104: 음원 파일이 없거나 보관 시간이 만료되었습니다.",
        )
    return FileResponse(
        path,
        media_type="audio/wav",
        filename=path.name,
        content_disposition_type="inline",
        headers={"Cache-Control": "private, no-store, max-age=0"},
    )
