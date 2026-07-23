# 🤖 AgentForge - AI Chatbot Platform

A full-stack chatbot platform that allows users to create AI-powered agents with custom system prompts and chat interfaces. Built as a production-grade application demonstrating modern web development best practices.

![Tech Stack](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square)
![Tech Stack](https://img.shields.io/badge/Frontend-React-61DAFB?style=flat-square)
![Tech Stack](https://img.shields.io/badge/LLM-Groq_LLaMA_3.3-orange?style=flat-square)
![Tech Stack](https://img.shields.io/badge/Auth-JWT-red?style=flat-square)

## ✨ Features

### Core Features
- **🔐 Authentication** - JWT-based registration and login with bcrypt password hashing
- **📁 Project Management** - Create, edit, and delete AI agent projects
- **🎯 Custom System Prompts** - Define agent behavior with configurable system prompts
- **📝 Prompt Library** - Associate additional context prompts with each project
- **💬 AI Chat Interface** - Real-time chat with AI agents powered by Groq (LLaMA 3.3 70B)
- **📎 File Uploads** - Upload and manage files within projects
- **📱 Responsive Design** - Premium dark theme UI with glassmorphism effects

### Non-Functional
- **Scalability** - Async architecture supports concurrent users
- **Security** - JWT auth, password hashing, input validation, ownership verification
- **Extensibility** - Modular router/service architecture for easy feature additions
- **Performance** - Groq API delivers ~500 tokens/sec inference speed
- **Reliability** - Comprehensive error handling with user-friendly feedback

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend | **FastAPI** (Python) | Async REST API with auto-generated OpenAPI docs |
| Database | **SQLite** + SQLAlchemy | Zero-config persistent storage with async ORM |
| Auth | **JWT** (python-jose + bcrypt) | Stateless, scalable authentication |
| LLM | **Groq API** (LLaMA 3.3 70B) | Fast AI inference (OpenAI-compatible) |
| Frontend | **React** (Vite) | Modern SPA with component architecture |
| Styling | **Vanilla CSS** | Custom design system with CSS variables |

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Groq API Key (free at [console.groq.com](https://console.groq.com))

### 1. Clone the Repository

```bash
git clone <repository-url>
cd yellow.ai
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit .env and add your GROQ_API_KEY
notepad .env

# Start the server
python -m uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 4. Configure Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Generate an API key
4. Add it to `backend/.env`:
   ```
   GROQ_API_KEY=gsk_your_api_key_here
   ```

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| GET | `/api/auth/me` | Get current user profile |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects` | Create project |
| GET | `/api/projects` | List user's projects |
| GET | `/api/projects/:id` | Get project details |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

### Prompts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects/:id/prompts` | Create prompt |
| GET | `/api/projects/:id/prompts` | List project prompts |
| PUT | `/api/prompts/:id` | Update prompt |
| DELETE | `/api/prompts/:id` | Delete prompt |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects/:id/chat` | Send message & get AI response |
| GET | `/api/projects/:id/messages` | Get chat history |
| DELETE | `/api/projects/:id/messages` | Clear chat history |

### Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects/:id/files` | Upload file |
| GET | `/api/projects/:id/files` | List project files |
| DELETE | `/api/files/:id` | Delete file |

## 📁 Project Structure

```
yellow.ai/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py             # Environment configuration
│   ├── database.py           # Async SQLAlchemy setup
│   ├── models.py             # Database models (ORM)
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── auth.py               # JWT authentication module
│   ├── requirements.txt      # Python dependencies
│   ├── .env                  # Environment variables
│   ├── routers/
│   │   ├── auth_router.py    # Auth endpoints
│   │   ├── project_router.py # Project CRUD endpoints
│   │   ├── prompt_router.py  # Prompt CRUD endpoints
│   │   ├── chat_router.py    # Chat & LLM endpoints
│   │   └── file_router.py    # File upload endpoints
│   └── services/
│       └── llm_service.py    # Groq LLM integration
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Routes & auth wrapper
│   │   ├── main.jsx          # React entry point
│   │   ├── index.css         # Design system & styles
│   │   ├── api/
│   │   │   └── client.js     # Axios API client
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Auth state management
│   │   ├── components/
│   │   │   ├── Navbar.jsx    # Navigation bar
│   │   │   ├── Modal.jsx     # Reusable modal
│   │   │   └── Toast.jsx     # Toast notifications
│   │   └── pages/
│   │       ├── LoginPage.jsx
│   │       ├── RegisterPage.jsx
│   │       ├── DashboardPage.jsx
│   │       ├── ProjectPage.jsx
│   │       └── ChatPage.jsx
│   └── index.html
├── README.md
└── ARCHITECTURE.md
```

## 🎨 Design

The UI features a premium dark theme with:
- **Glassmorphism** cards with backdrop blur effects
- **Gradient accents** (purple to lavender)
- **Micro-animations** on hover, transitions, and page loads
- **Responsive layout** that works on desktop and mobile
- **Custom scrollbars** and smooth scrolling

## 📄 License

MIT
