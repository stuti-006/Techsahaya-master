import asyncio
import base64
import io
import struct
import wave
from unittest.mock import AsyncMock, patch
import pytest
from httpx import Response
from fastapi.testclient import TestClient

from main import app
from app.services.sarvam_service import SarvamAPIError, SarvamVoiceService, sarvam_service
from app.core.rate_limit import rate_limiter


def make_sample_wav_bytes(duration_sec: float = 0.1, sample_rate: int = 16000) -> bytes:
    out = io.BytesIO()
    with wave.open(out, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        num_samples = int(duration_sec * sample_rate)
        wav_file.writeframes(struct.pack(f"<{num_samples}h", *[0] * num_samples))
    return out.getvalue()


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    rate_limiter.reset()


def get_auth_headers(client: TestClient) -> dict[str, str]:
    response = client.post("/api/auth/login", json={"email": "citizen@techsahaya.org", "password": "Citizen@123", "remember_session": False})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['token']}"}


def test_sarvam_stt_happy_path():
    service = SarvamVoiceService()
    sample_audio = make_sample_wav_bytes()

    mock_resp = Response(
        status_code=200,
        json={"transcript": "What schemes are for farmers?", "language_code": "en-IN"},
        request=None
    )

    with patch("app.services.sarvam_service.get_settings") as mock_settings:
        mock_settings.return_value.sarvam_api_key = "test-key"
        mock_settings.return_value.sarvam_api_base_url = "https://api.sarvam.ai"
        mock_settings.return_value.sarvam_stt_model = "saarika:v2.5"

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_resp
            result = asyncio.run(service.speech_to_text(sample_audio, language_code="en"))
            assert result.transcript == "What schemes are for farmers?"
            assert result.language_code == "en-IN"


def test_sarvam_stt_transcoding_regression():
    """Verify that incoming audio is transcoded to 16kHz mono WAV before being sent to Sarvam."""
    service = SarvamVoiceService()
    sample_audio = make_sample_wav_bytes()

    mock_resp = Response(
        status_code=200,
        json={"transcript": "Namaste Sahaya", "language_code": "hi-IN"},
        request=None
    )

    with patch("app.services.sarvam_service.get_settings") as mock_settings:
        mock_settings.return_value.sarvam_api_key = "test-key"
        mock_settings.return_value.sarvam_api_base_url = "https://api.sarvam.ai"
        mock_settings.return_value.sarvam_stt_model = "saarika:v2.5"

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_resp
            result = asyncio.run(service.speech_to_text(sample_audio, language_code="hi"))
            assert result.transcript == "Namaste Sahaya"

            # Assert files payload passed to httpx contains valid WAV bytes with RIFF/WAVE header
            assert mock_post.called
            call_kwargs = mock_post.call_args.kwargs
            assert "files" in call_kwargs
            file_tuple = call_kwargs["files"]["file"]
            filename, file_bytes, mime_type = file_tuple
            assert filename == "audio.wav"
            assert mime_type == "audio/wav"
            assert isinstance(file_bytes, bytes)
            assert file_bytes.startswith(b"RIFF")
            assert b"WAVE" in file_bytes[:16]


def test_sarvam_tts_happy_path():
    service = SarvamVoiceService()
    fake_audio_base64 = base64.b64encode(b"FAKE_AUDIO_DATA").decode("utf-8")

    mock_resp = Response(
        status_code=200,
        json={"audios": [fake_audio_base64]},
        request=None
    )

    with patch("app.services.sarvam_service.get_settings") as mock_settings:
        mock_settings.return_value.sarvam_api_key = "test-key"
        mock_settings.return_value.sarvam_api_base_url = "https://api.sarvam.ai"
        mock_settings.return_value.sarvam_tts_model = "bulbul:v3"
        mock_settings.return_value.sarvam_tts_voice = "meera"

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_resp
            audio_bytes = asyncio.run(service.text_to_speech("PM-Kisan is a farmer scheme", language_code="en"))
            assert audio_bytes == b"FAKE_AUDIO_DATA"


def test_sarvam_circuit_breaker_and_timeout():
    service = SarvamVoiceService()
    service.circuit_breaker.failure_threshold = 2
    service.circuit_breaker.cooldown_seconds = 10.0
    sample_audio = make_sample_wav_bytes()

    with patch("app.services.sarvam_service.get_settings") as mock_settings:
        mock_settings.return_value.sarvam_api_key = "test-key"
        mock_settings.return_value.sarvam_api_base_url = "https://api.sarvam.ai"

        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.side_effect = Exception("Connection Timeout")

            with pytest.raises(SarvamAPIError):
                asyncio.run(service.speech_to_text(sample_audio, language_code="en"))

            with pytest.raises(SarvamAPIError):
                asyncio.run(service.speech_to_text(sample_audio, language_code="en"))

            # Circuit breaker should now be OPEN
            assert service.circuit_breaker.state == "OPEN"


def test_rate_limiting_ai_tier(client):
    headers = get_auth_headers(client)
    url = "/api/chat"
    payload = {"message": "Farmer schemes", "language": "en"}

    from app.models.schemas import ChatResponse
    dummy_resp = ChatResponse(answer="Mock answer", confidence="high", schemes=[], evidence=[], verification_status="verified")

    with patch("app.routers.api.chat_service.answer", return_value=dummy_resp), \
         patch("app.routers.api.sarvam_service.text_to_speech", new_callable=AsyncMock, return_value=b"FAKE_AUDIO"):
        # AI tier limit is 10 requests per minute by default
        for i in range(10):
            res = client.post(url, json=payload, headers=headers)
            assert res.status_code == 200, f"Request {i} failed unexpectedly"

        # 11th request should trigger 429 Too Many Requests
        blocked_res = client.post(url, json=payload, headers=headers)
        assert blocked_res.status_code == 429
        assert "Retry-After" in blocked_res.headers
        assert "Rate limit exceeded" in blocked_res.json()["detail"]


def test_config_endpoints(client):
    lang_res = client.get("/api/config/languages")
    assert lang_res.status_code == 200
    assert "languages" in lang_res.json()
    assert any(item["code"] == "en" for item in lang_res.json()["languages"])

    tours_res = client.get("/api/config/tours")
    assert tours_res.status_code == 200
    assert "allowlist" in tours_res.json()
    assert "upload_income_proof" in tours_res.json()["allowlist"]
