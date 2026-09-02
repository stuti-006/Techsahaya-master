import json
from functools import lru_cache
from typing import List, Union

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


VALID_BULBUL_V3_SPEAKERS = {
    "aditya", "ritu", "ashutosh", "priya", "neha", "rahul", "pooja", "rohan",
    "simran", "kavya", "amit", "dev", "ishita", "shreya", "ratan", "varun",
    "manan", "sumit", "roopa", "kabir", "aayan", "shubh", "advait", "anand",
    "tanya", "tarun", "sunny", "mani", "gokul", "vijay", "shruti", "suhani",
    "mohit", "kavitha", "rehan", "soham", "rupali", "niharika"
}


class Settings(BaseSettings):
    # Core Provider Keys
    gemini_api_key: str = ""
    google_api_key: str = ""
    bhashini_api_key: str = ""
    sarvam_api_key: str = ""
    sarvam_api_base_url: str = "https://api.sarvam.ai"
    # Sarvam Speech-to-Text Model: Use 'saarika:*' (verbatim transcription in spoken language)
    # rather than 'saaras:*' (translation to English).
    # Supported values change over time; refer to https://docs.sarvam.ai/api-reference/speech-to-text
    sarvam_stt_model: str = "saarika:v2.5"
    sarvam_tts_model: str = "bulbul:v3"

    sarvam_tts_voice: str = "ishita"

    voice_provider: str = "sarvam"

    # AI Model Selection
    gemini_model: str = "gemini-2.5-flash"
    gemini_fallback_model: str = "gemini-1.5-flash"

    # Auth & Database
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    auth_adapter: str = "local"
    database_url: str = "sqlite:///./tech_sahaya_secure.db"
    faiss_index_path: str = "./data/faiss_index"
    redis_url: str = "redis://localhost:6379/0"
    redis_ephemeral_ttl: int = 300

    # Uploads & Rate Limiting
    max_upload_size: int = 5_242_880
    rate_limit_per_minute_default: int = 60
    rate_limit_per_minute_ai: int = 10
    rate_limit_per_minute: int = 60  # legacy alias

    # Security & Guardrails
    prompt_injection_guard_enabled: bool = True
    max_chat_input_length: int = 1000
    cors_origins: Union[List[str], str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # Dynamic Config Paths
    languages_config_path: str = "./data/config/languages.json"
    tours_config_path: str = "./data/config/tours.json"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("sarvam_tts_voice")
    @classmethod
    def validate_sarvam_tts_voice(cls, value: str) -> str:
        if not value:
            return "ishita"
        val_clean = value.strip().lower()
        if val_clean not in VALID_BULBUL_V3_SPEAKERS:
            raise ValueError(
                f"Invalid Sarvam TTS voice '{value}'. Must be one of valid bulbul:v3 speakers: {sorted(VALID_BULBUL_V3_SPEAKERS)}"
            )
        return val_clean

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Union[str, List[str]]) -> List[str]:
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            val = value.strip()
            if val.startswith("[") and val.endswith("]"):
                try:
                    parsed = json.loads(val)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if str(item).strip()]
                except Exception:
                    pass
            return [item.strip() for item in val.split(",") if item.strip()]
        return ["http://localhost:5173", "http://127.0.0.1:5173"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
