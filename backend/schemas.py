from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# ─── Auth Schemas ────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, examples=["John Doe"])
    email: EmailStr = Field(..., examples=["john@example.com"])
    password: str = Field(..., min_length=6, max_length=100, examples=["securepassword123"])


class UserLogin(BaseModel):
    email: EmailStr = Field(..., examples=["john@example.com"])
    password: str = Field(..., examples=["securepassword123"])


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ─── Project Schemas ─────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, examples=["Customer Support Bot"])
    description: str = Field(default="", max_length=1000, examples=["A bot that handles customer queries"])
    system_prompt: str = Field(
        default="You are a helpful AI assistant.",
        max_length=5000,
        examples=["You are a friendly customer support agent for an e-commerce company."]
    )


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    system_prompt: Optional[str] = Field(None, max_length=5000)


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    system_prompt: str
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    prompt_count: int = 0
    message_count: int = 0
    file_count: int = 0

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    id: str
    name: str
    description: str
    created_at: datetime
    prompt_count: int = 0
    message_count: int = 0
    file_count: int = 0

    class Config:
        from_attributes = True


# ─── Prompt Schemas ──────────────────────────────────────────────────────────

class PromptCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, examples=["Greeting Prompt"])
    content: str = Field(..., min_length=1, max_length=5000, examples=["Greet the user warmly and ask how you can help."])


class PromptUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1, max_length=5000)


class PromptResponse(BaseModel):
    id: str
    title: str
    content: str
    project_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Chat Schemas ────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000, examples=["Hello, how can you help me?"])


class ChatResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    project_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─── File Schemas ────────────────────────────────────────────────────────────

class FileResponse(BaseModel):
    id: str
    filename: str
    original_filename: str
    file_size: int
    content_type: str
    project_id: str
    created_at: datetime

    class Config:
        from_attributes = True
