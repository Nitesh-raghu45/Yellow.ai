import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import init_db

# Import routers
from routers.auth_router import router as auth_router
from routers.project_router import router as project_router
from routers.prompt_router import router as prompt_router
from routers.chat_router import router as chat_router
from routers.file_router import router as file_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    await init_db()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    print(f"[START] {settings.APP_NAME} v{settings.APP_VERSION} started")
    print(f"[DB] Database initialized")
    print(f"[LLM] Model: {settings.LLM_MODEL}")
    print(f"[KEY] Groq API Key: {'Configured' if settings.GROQ_API_KEY else 'Not set'}")
    yield
    # Shutdown
    print("[STOP] Application shutting down")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="A chatbot platform with AI-powered agents, built for Yellow.ai",
    lifespan=lifespan,
)

# CORS middleware - allow frontend
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:3000,http://127.0.0.1:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(project_router)
app.include_router(prompt_router)
app.include_router(chat_router)
app.include_router(file_router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "llm_configured": bool(settings.GROQ_API_KEY),
    }
