# Architecture & Design Document

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Client Layer                        │
│  ┌─────────────────────────────────────────────────────┐ │
│  │         React SPA (Vite + React Router)             │ │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────────────┐   │ │
│  │  │Auth Pages│ │Dashboard │ │   Chat Interface   │   │ │
│  │  └──────────┘ └──────────┘ └───────────────────┘   │ │
│  │          ↕ Axios HTTP Client (JWT Bearer)           │ │
│  └─────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/REST (JSON)
┌────────────────────────┴────────────────────────────────┐
│                    API Gateway Layer                      │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              FastAPI Application                     │ │
│  │  ┌──────────────┐  ┌────────────────────────────┐   │ │
│  │  │ CORS Middle- │  │    JWT Auth Middleware      │   │ │
│  │  │     ware     │  │  (python-jose + bcrypt)     │   │ │
│  │  └──────────────┘  └────────────────────────────┘   │ │
│  │                                                      │ │
│  │  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐  │ │
│  │  │Auth API │ │Project   │ │Chat API│ │File API  │  │ │
│  │  │Router   │ │API Router│ │Router  │ │Router    │  │ │
│  │  └─────────┘ └──────────┘ └────────┘ └──────────┘  │ │
│  └─────────────────────────────────────────────────────┘ │
└──────┬──────────────────────────┬───────────────────────┘
       │                          │
┌──────┴──────────┐    ┌──────────┴──────────────────────┐
│  Data Layer     │    │      External Services           │
│ ┌─────────────┐ │    │ ┌────────────────────────────┐   │
│ │ SQLAlchemy  │ │    │ │      Groq Cloud API        │   │
│ │ Async ORM   │ │    │ │   (LLaMA 3.3 70B Model)    │   │
│ │      ↕      │ │    │ │                            │   │
│ │  SQLite DB  │ │    │ │  - Chat Completions API    │   │
│ │             │ │    │ │  - OpenAI-compatible       │   │
│ └─────────────┘ │    │ └────────────────────────────┘   │
│ ┌─────────────┐ │    │ ┌────────────────────────────┐   │
│ │ File System │ │    │ │    (Extensible to other     │   │
│ │  (uploads/) │ │    │ │     LLM providers)          │   │
│ └─────────────┘ │    │ └────────────────────────────┘   │
└─────────────────┘    └─────────────────────────────────┘
```

## Database Schema (ERD)

```
┌─────────────────┐       ┌──────────────────────┐
│      Users      │       │      Projects         │
├─────────────────┤       ├──────────────────────┤
│ id (PK)         │───┐   │ id (PK)              │
│ email (UNIQUE)  │   │   │ name                 │
│ name            │   └──→│ user_id (FK)         │
│ hashed_password │       │ description          │
│ created_at      │       │ system_prompt        │
└─────────────────┘       │ created_at           │
                          │ updated_at           │
                          └───────┬──────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
              ┌─────┴─────┐ ┌────┴────┐  ┌────┴────┐
              │  Prompts  │ │Messages │  │  Files  │
              ├───────────┤ ├─────────┤  ├─────────┤
              │ id (PK)   │ │ id (PK) │  │ id (PK) │
              │ title     │ │role     │  │filename │
              │ content   │ │content  │  │filepath │
              │project_id │ │project  │  │project  │
              │ (FK)      │ │_id (FK) │  │_id (FK) │
              │created_at │ │created  │  │file_size│
              │updated_at │ │_at      │  │content  │
              └───────────┘ └─────────┘  │_type    │
                                         │created  │
                                         │_at      │
                                         └─────────┘
```

## Key Design Decisions

### 1. Authentication Strategy: JWT (Stateless)

**Decision**: Use JWT tokens instead of session-based auth.

**Rationale**:
- Stateless: No server-side session storage needed
- Horizontally scalable: Any server instance can validate tokens
- Industry standard for API-first architectures
- Natural fit for SPA frontends with Authorization headers

**Implementation**:
- Passwords hashed with bcrypt (cost factor 12)
- JWT signed with HS256 algorithm
- 24-hour token expiry
- Automatic token refresh on frontend via interceptors

### 2. LLM Provider: Groq API

**Decision**: Use Groq instead of OpenAI.

**Rationale**:
- Free tier available (no credit card required)
- Blazing fast inference (~500 tokens/sec vs ~50 for OpenAI)
- OpenAI-compatible API interface
- LLaMA 3.3 70B provides excellent response quality
- Easy to swap to OpenAI/OpenRouter by changing the client

### 3. Database: SQLite with Async SQLAlchemy

**Decision**: Use SQLite for demo/development, with SQLAlchemy ORM for production portability.

**Rationale**:
- Zero configuration needed for evaluation
- SQLAlchemy ORM abstracts SQL dialect differences
- Trivial migration to PostgreSQL for production (change one connection string)
- Async sessions via aiosqlite for non-blocking I/O

### 4. Frontend Architecture: React SPA with Context API

**Decision**: Use React with Context API instead of Redux/Zustand.

**Rationale**:
- Application state is simple (auth + per-page data)
- Context API sufficient for auth state propagation
- Per-page data fetching keeps components self-contained
- Reduces bundle size and complexity

### 5. Conversation Context Management

**Decision**: Send last 20 messages as conversation context to LLM.

**Rationale**:
- Provides sufficient context for coherent multi-turn conversations
- Prevents exceeding LLM context window limits
- Associated prompts are injected into the system message for additional context
- All messages persisted in DB for full history access

## Security Considerations

1. **Password Security**: bcrypt hashing with salt (never stored in plaintext)
2. **Token Validation**: JWT signature verification on every protected endpoint
3. **Resource Isolation**: All CRUD operations verify resource ownership
4. **Input Validation**: Pydantic schemas enforce type checking and constraints
5. **CORS Configuration**: Restricted to known frontend origins
6. **File Upload Safety**: Size limits, unique filename generation, type validation
7. **SQL Injection Prevention**: SQLAlchemy ORM parameterizes all queries

## Scalability Path

The current architecture is designed for easy scaling:

1. **Database**: Replace SQLite with PostgreSQL (change connection string)
2. **File Storage**: Replace local disk with S3/GCS (modify file router)
3. **Caching**: Add Redis for session caching and rate limiting
4. **Load Balancing**: JWT auth is stateless, enabling horizontal scaling
5. **Message Queue**: Add Celery/RabbitMQ for async LLM processing
6. **Container**: Docker-compose for consistent deployment

## Performance Optimizations

- **Async everywhere**: FastAPI + async SQLAlchemy + async Groq client
- **Connection pooling**: SQLAlchemy manages database connection pool
- **Optimistic updates**: Frontend shows user messages immediately
- **Lazy loading**: Only load data when navigating to a page
- **Index on email**: Database index for fast user lookup during auth
