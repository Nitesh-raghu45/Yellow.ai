from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models import User, Project, Prompt, Message
from schemas import ChatRequest, ChatResponse, MessageResponse
from services.llm_service import llm_service

router = APIRouter(tags=["Chat"])


async def _get_user_project(project_id: str, user_id: str, db: AsyncSession) -> Project:
    """Helper to verify project ownership."""
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.post("/api/projects/{project_id}/chat", response_model=ChatResponse)
async def send_message(
    project_id: str,
    chat_data: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a message to the project's AI agent and get a response."""
    project = await _get_user_project(project_id, current_user.id, db)

    # Save user message
    user_message = Message(
        project_id=project_id,
        role="user",
        content=chat_data.message,
    )
    db.add(user_message)
    await db.flush()

    # Get conversation history
    result = await db.execute(
        select(Message)
        .where(Message.project_id == project_id)
        .order_by(Message.created_at.asc())
    )
    messages = result.scalars().all()
    conversation_history = [
        {"role": msg.role, "content": msg.content}
        for msg in messages[:-1]  # Exclude the message we just added
    ]

    # Get associated prompts for context
    result = await db.execute(
        select(Prompt).where(Prompt.project_id == project_id)
    )
    prompts = result.scalars().all()
    prompt_context = "\n\n".join(
        [f"[{p.title}]: {p.content}" for p in prompts]
    ) if prompts else ""

    # Generate LLM response
    ai_response = await llm_service.generate_response(
        user_message=chat_data.message,
        system_prompt=project.system_prompt,
        conversation_history=conversation_history,
        prompt_context=prompt_context,
    )

    # Save assistant message
    assistant_message = Message(
        project_id=project_id,
        role="assistant",
        content=ai_response,
    )
    db.add(assistant_message)
    await db.flush()
    await db.refresh(assistant_message)

    return ChatResponse(
        id=assistant_message.id,
        role="assistant",
        content=ai_response,
        created_at=assistant_message.created_at,
    )


@router.get("/api/projects/{project_id}/messages", response_model=list[MessageResponse])
async def get_messages(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all chat messages for a project."""
    await _get_user_project(project_id, current_user.id, db)

    result = await db.execute(
        select(Message)
        .where(Message.project_id == project_id)
        .order_by(Message.created_at.asc())
    )
    messages = result.scalars().all()
    return [MessageResponse.model_validate(m) for m in messages]


@router.delete("/api/projects/{project_id}/messages", status_code=status.HTTP_204_NO_CONTENT)
async def clear_messages(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Clear all chat messages for a project."""
    await _get_user_project(project_id, current_user.id, db)

    result = await db.execute(
        select(Message).where(Message.project_id == project_id)
    )
    messages = result.scalars().all()
    for msg in messages:
        await db.delete(msg)
    await db.flush()
