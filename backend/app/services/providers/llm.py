from dataclasses import dataclass
from time import perf_counter

import httpx

from app.core.config import get_settings


@dataclass
class LLMResult:
    text: str
    provider: str
    latency_ms: int
    token_usage: int | None
    fallback_used: bool = False


class GeminiProvider:
    def __init__(self) -> None:
        self.settings = get_settings()

    def generate(self, system_prompt: str, user_prompt: str) -> LLMResult:
        if not self.settings.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured.")
        endpoint = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"gemini-2.0-flash:generateContent?key={self.settings.gemini_api_key}"
        )
        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"parts": [{"text": user_prompt}]}],
        }
        started = perf_counter()
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(endpoint, json=payload)
            resp.raise_for_status()
            data = resp.json()
        latency_ms = int((perf_counter() - started) * 1000)

        candidates = data.get("candidates", [])
        if not candidates:
            raise RuntimeError("Gemini returned no candidates.")
        parts = candidates[0].get("content", {}).get("parts", [])
        text = "".join(part.get("text", "") for part in parts)
        if not text:
            raise RuntimeError("Gemini returned empty text.")
        usage = data.get("usageMetadata", {})
        token_usage = usage.get("totalTokenCount")
        return LLMResult(text=text, provider="GEMINI", latency_ms=latency_ms, token_usage=token_usage)


class OpenAIProvider:
    def __init__(self) -> None:
        self.settings = get_settings()

    def generate(self, system_prompt: str, user_prompt: str) -> LLMResult:
        if not self.settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is not configured.")

        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.2,
        }
        headers = {"Authorization": f"Bearer {self.settings.openai_api_key}"}
        started = perf_counter()
        with httpx.Client(timeout=30.0) as client:
            resp = client.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
        latency_ms = int((perf_counter() - started) * 1000)
        choices = data.get("choices", [])
        if not choices:
            raise RuntimeError("OpenAI returned no choices.")
        text = choices[0].get("message", {}).get("content", "")
        if not text:
            raise RuntimeError("OpenAI returned empty text.")
        token_usage = data.get("usage", {}).get("total_tokens")
        return LLMResult(text=text, provider="OPENAI", latency_ms=latency_ms, token_usage=token_usage)


class LLMRouter:
    def __init__(self) -> None:
        settings = get_settings()
        configured_order = [item.strip().upper() for item in settings.llm_provider_order.split(",") if item.strip()]
        self.default_order = configured_order if configured_order else ["GEMINI", "OPENAI"]
        self.providers = {
            "GEMINI": GeminiProvider(),
            "OPENAI": OpenAIProvider(),
        }

    def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        preferred_order: list[str] | None = None,
    ) -> LLMResult:
        order = [item.upper() for item in (preferred_order or self.default_order)]
        errors: list[str] = []
        for name in order:
            provider = self.providers.get(name)
            if not provider:
                continue
            try:
                result = provider.generate(system_prompt=system_prompt, user_prompt=user_prompt)
                result.fallback_used = len(errors) > 0
                return result
            except Exception as exc:  # noqa: BLE001
                errors.append(f"{name}: {exc}")
        raise RuntimeError("All LLM providers failed: " + "; ".join(errors))
