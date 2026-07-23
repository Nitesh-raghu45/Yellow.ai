from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from auth import get_current_user
from database import get_db
from models import User, Project, Prompt, Message, File
from schemas import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse

router = APIRouter(prefix="/api/projects", tags=["Projects"])


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new project/agent under the current user."""
    project = Project(
        name=project_data.name,
        description=project_data.description,
        system_prompt=project_data.system_prompt,
        user_id=current_user.id,
    )
    db.add(project)
    await db.flush()
    await db.refresh(project)

    return ProjectResponse(
        **{
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "system_prompt": project.system_prompt,
            "user_id": project.user_id,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
            "prompt_count": 0,
            "message_count": 0,
            "file_count": 0,
        }
    )


@router.get("", response_model=list[ProjectListResponse])
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all projects for the current user."""
    result = await db.execute(
        select(Project)
        .where(Project.user_id == current_user.id)
        .order_by(Project.created_at.desc())
    )
    projects = result.scalars().all()

    response = []
    for project in projects:
        # Count related entities
        prompt_count = await db.scalar(
            select(func.count(Prompt.id)).where(Prompt.project_id == project.id)
        )
        message_count = await db.scalar(
            select(func.count(Message.id)).where(Message.project_id == project.id)
        )
        file_count = await db.scalar(
            select(func.count(File.id)).where(File.project_id == project.id)
        )

        response.append(
            ProjectListResponse(
                id=project.id,
                name=project.name,
                description=project.description,
                created_at=project.created_at,
                prompt_count=prompt_count or 0,
                message_count=message_count or 0,
                file_count=file_count or 0,
            )
        )

    return response


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific project's details."""
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user.id,
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    prompt_count = await db.scalar(
        select(func.count(Prompt.id)).where(Prompt.project_id == project.id)
    )
    message_count = await db.scalar(
        select(func.count(Message.id)).where(Message.project_id == project.id)
    )
    file_count = await db.scalar(
        select(func.count(File.id)).where(File.project_id == project.id)
    )

    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        system_prompt=project.system_prompt,
        user_id=project.user_id,
        created_at=project.created_at,
        updated_at=project.updated_at,
        prompt_count=prompt_count or 0,
        message_count=message_count or 0,
        file_count=file_count or 0,
    )


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a project's details."""
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user.id,
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    update_data = project_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    await db.flush()
    await db.refresh(project)

    prompt_count = await db.scalar(
        select(func.count(Prompt.id)).where(Prompt.project_id == project.id)
    )
    message_count = await db.scalar(
        select(func.count(Message.id)).where(Message.project_id == project.id)
    )
    file_count = await db.scalar(
        select(func.count(File.id)).where(File.project_id == project.id)
    )

    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        system_prompt=project.system_prompt,
        user_id=project.user_id,
        created_at=project.created_at,
        updated_at=project.updated_at,
        prompt_count=prompt_count or 0,
        message_count=message_count or 0,
        file_count=file_count or 0,
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a project and all its associated data."""
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user.id,
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    await db.delete(project)
    await db.flush()
