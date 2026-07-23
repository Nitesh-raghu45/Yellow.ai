from typing import List
from groq import AsyncGroq
from config import settings


class LLMService:
    """Service for interacting with Groq LLM API."""

    def __init__(self):
        self.client = None
        self._initialize_client()

    def _initialize_client(self):
        """Initialize the Groq client."""
        if settings.GROQ_API_KEY:
            self.client = AsyncGroq(api_key=settings.GROQ_API_KEY)

    async def generate_response(
        self,
        user_message: str,
        system_prompt: str,
        conversation_history: List[dict] = None,
        prompt_context: str = "",
    ) -> str:
        """
        Generate a response from the LLM.
        
        Args:
            user_message: The user's input message
            system_prompt: The project's system prompt
            conversation_history: List of previous messages [{"role": "user/assistant", "content": "..."}]
            prompt_context: Additional prompt context from associated prompts
        
        Returns:
            The assistant's response text
        """
        if not self.client:
            return (
                "⚠️ LLM service is not configured. Please set your GROQ_API_KEY in the .env file.\n\n"
                "To get a free API key:\n"
                "1. Visit https://console.groq.com\n"
                "2. Sign up for a free account\n"
                "3. Generate an API key\n"
                "4. Add it to your backend/.env file as GROQ_API_KEY=your_key_here"
            )

        # Build the messages array
        messages = []

        # System message with project prompt and any associated prompts
        full_system_prompt = system_prompt
        if prompt_context:
            full_system_prompt += f"\n\nAdditional Context:\n{prompt_context}"

        messages.append({"role": "system", "content": full_system_prompt})

        # Add conversation history (last 20 messages for context window management)
        if conversation_history:
            recent_history = conversation_history[-20:]
            for msg in recent_history:
                messages.append({
                    "role": msg["role"],
                    "content": msg["content"],
                })

        # Add the current user message
        messages.append({"role": "user", "content": user_message})

        try:
            response = await self.client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=messages,
                max_tokens=settings.LLM_MAX_TOKENS,
                temperature=settings.LLM_TEMPERATURE,
                top_p=1,
                stream=False,
            )

            return response.choices[0].message.content

        except Exception as e:
            error_msg = str(e)
            if "rate_limit" in error_msg.lower():
                return "⏳ Rate limit reached. Please wait a moment and try again."
            elif "invalid_api_key" in error_msg.lower() or "authentication" in error_msg.lower():
                return "🔑 Invalid API key. Please check your GROQ_API_KEY in the .env file."
            else:
                return f"❌ An error occurred while generating the response: {error_msg}"


# Singleton instance
llm_service = LLMService()
