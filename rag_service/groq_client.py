import os
import requests
from typing import List, Dict, Optional

class GroqClient:
    def __init__(self, api_key: str = None, model: str = None):
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        self.model = model or os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"

    def chat_completion(
        self,
        messages: List[Dict],
        temperature: float = 0.5,
        max_tokens: int = 2000,
        model: Optional[str] = None,
        timeout: int = 30,
    ) -> str:
        if not self.api_key:
            raise ValueError("Groq API Key not found in environment or constructor.")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": model or self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        attempts = 2
        last_error: Optional[Exception] = None
        for attempt in range(attempts):
            try:
                response = requests.post(self.base_url, headers=headers, json=payload, timeout=timeout)
                response.raise_for_status()
                result = response.json()
                return result["choices"][0]["message"]["content"]
            except Exception as e:
                last_error = e
                if attempt == attempts - 1:
                    break

        print(f"[GroqClient] Error: {last_error}")
        raise last_error

    def generate_legal_content(self, prompt: str, system_prompt: str = "You are a helpful Indian Legal Assistant.") -> str:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
        return self.chat_completion(messages)
