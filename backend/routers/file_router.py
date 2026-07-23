import os
import uuid
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File as FastAPIFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from config import settings
from database import get_db
from models import User, Project, File
from schemas import FileResponse

router = APIRouter(tags=["Files"])


async def _get_user_project(project_id: str, user_id: str, db: AsyncSession) -> Project:
    """Helper to verify project ownership."""
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.post(
    "/api/projects/{project_id}/files",
    response_model=FileResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_file(
    project_id: str,
    file: UploadFile = FastAPIFile(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a file to a project."""
    await _get_user_project(project_id, current_user.id, db)

    # Validate file size
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed size of {settings.MAX_FILE_SIZE // (1024 * 1024)}MB",
        )

    # Create upload directory for this project
    project_upload_dir = os.path.join(settings.UPLOAD_DIR, project_id)
    os.makedirs(project_upload_dir, exist_ok=True)

    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1] if file.filename else ""
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    filepath = os.path.join(project_upload_dir, unique_filename)

    # Save file to disk
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)

    # Save file metadata to database
    file_record = File(
        project_id=project_id,
        filename=unique_filename,
        original_filename=file.filename or "unnamed",
        filepath=filepath,
        file_size=len(content),
        content_type=file.content_type or "application/octet-stream",
    )
    db.add(file_record)
    await db.flush()
    await db.refresh(file_record)

    return FileResponse.model_validate(file_record)


@router.get("/api/projects/{project_id}/files", response_model=list[FileResponse])
async def list_files(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all files for a project."""
    await _get_user_project(project_id, current_user.id, db)

    result = await db.execute(
        select(File)
        .where(File.project_id == project_id)
        .order_by(File.created_at.desc())
    )
    files = result.scalars().all()
    return [FileResponse.model_validate(f) for f in files]


@router.delete("/api/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a file."""
    result = await db.execute(select(File).where(File.id == file_id))
    file_record = result.scalar_one_or_none()
    if not file_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    # Verify ownership
    await _get_user_project(file_record.project_id, current_user.id, db)

    # Delete physical file
    if os.path.exists(file_record.filepath):
        os.remove(file_record.filepath)

    # Delete database record
    await db.delete(file_record)
    await db.flush()
