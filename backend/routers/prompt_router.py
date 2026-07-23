from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models import User, Project, Prompt
from schemas import PromptCreate, PromptUpdate, PromptResponse

router = APIRouter(tags=["Prompts"])


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
    "/api/projects/{project_id}/prompts",
    response_model=PromptResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_prompt(
    project_id: str,
    prompt_data: PromptCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new prompt associated with a project."""
    await _get_user_project(project_id, current_user.id, db)

    prompt = Prompt(
        title=prompt_data.title,
        content=prompt_data.content,
        project_id=project_id,
    )
    db.add(prompt)
    await db.flush()
    await db.refresh(prompt)

    return PromptResponse.model_validate(prompt)


@router.get("/api/projects/{project_id}/prompts", response_model=list[PromptResponse])
async def list_prompts(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all prompts for a project."""
    await _get_user_project(project_id, current_user.id, db)

    result = await db.execute(
        select(Prompt)
        .where(Prompt.project_id == project_id)
        .order_by(Prompt.created_at.desc())
    )
    prompts = result.scalars().all()
    return [PromptResponse.model_validate(p) for p in prompts]


@router.put("/api/prompts/{prompt_id}", response_model=PromptResponse)
async def update_prompt(
    prompt_id: str,
    prompt_data: PromptUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a prompt."""
    result = await db.execute(select(Prompt).where(Prompt.id == prompt_id))
    prompt = result.scalar_one_or_none()
    if not prompt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found")

    # Verify ownership
    await _get_user_project(prompt.project_id, current_user.id, db)

    update_data = prompt_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(prompt, field, value)

    await db.flush()
    await db.refresh(prompt)
    return PromptResponse.model_validate(prompt)


@router.delete("/api/prompts/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prompt(
    prompt_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a prompt."""
    result = await db.execute(select(Prompt).where(Prompt.id == prompt_id))
    prompt = result.scalar_one_or_none()
    if not prompt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found")

    # Verify ownership
    await _get_user_project(prompt.project_id, current_user.id, db)

    await db.delete(prompt)
    await db.flush()
