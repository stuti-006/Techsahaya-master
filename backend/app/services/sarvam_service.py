import asyncio
import base64
import glob
import io
import logging
import os
import re
import shutil
import time
from typing import NamedTuple
import httpx
from pydub import AudioSegment

from app.core.config import get_settings
from app.services.data_loader import load_languages

logger = logging.getLogger("techsahaya.sarvam_service")
settings = get_settings()


def ensure_ffmpeg_on_path() -> bool:
    """Ensure ffmpeg/ffprobe binary directory is added to system PATH and configured for pydub."""
    if shutil.which("ffmpeg"):
        return True

    potential_patterns = [
        os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages\*FFmpeg*\*\bin"),
        os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Links"),
        os.path.expandvars(r"%ProgramFiles%\ffmpeg\bin"),
        os.path.expandvars(r"%ProgramFiles(x86)%\ffmpeg\bin"),
        r"C:\ffmpeg\bin",
        r"C:\ProgramData\chocolatey\bin",
    ]
    for pattern in potential_patterns:
        for match in glob.glob(pattern):
            if os.path.exists(os.path.join(match, "ffmpeg.exe")) or os.path.exists(os.path.join(match, "ffmpeg")):
                os.environ["PATH"] = match + os.pathsep + os.environ.get("PATH", "")
                try:
                    AudioSegment.converter = os.path.join(match, "ffmpeg.exe") if os.name == "nt" else os.path.join(match, "ffmpeg")
                    AudioSegment.ffprobe = os.path.join(match, "ffprobe.exe") if os.name == "nt" else os.path.join(match, "ffprobe")
                except Exception:
                    pass
                return True
    return bool(shutil.which("ffmpeg"))


# Auto-discover ffmpeg location
ensure_ffmpeg_on_path()


def _transcode_to_wav(audio_bytes: bytes) -> bytes:
    """Transcode incoming audio bytes (WebM/Opus, WAV, or other formats) to 16kHz mono 16-bit PCM WAV.

    Sarvam STT natively accepts WebM/Opus and other codecs (auto-detected), so transcoding only
    happens to normalize when ffmpeg is available. If ffmpeg is unavailable, the original bytes are
    passed through unchanged so STT still works instead of hard-failing.
    """
    ffmpeg_available = ensure_ffmpeg_on_path()
    if not ffmpeg_available:
        logger.warning("ffmpeg not found on PATH — passing original audio bytes to Sarvam STT unchanged (Sarvam auto-detects codec).")
        return audio_bytes

    audio = None
    if audio_bytes.startswith(b"RIFF") and b"WAVE" in audio_bytes[:16]:
        try:
            audio = AudioSegment.from_file(io.BytesIO(audio_bytes), format="wav")
        except Exception:
            pass

    if audio is None:
        try:
            audio = AudioSegment.from_file(io.BytesIO(audio_bytes), format="webm")
        except (FileNotFoundError, OSError) as exc:
            raise SarvamAPIError("ffmpeg is not installed or not on PATH — required for audio transcoding", status_code=500)
        except Exception as exc:
            try:
                audio = AudioSegment.from_file(io.BytesIO(audio_bytes))
            except (FileNotFoundError, OSError):
                raise SarvamAPIError("ffmpeg is not installed or not on PATH — required for audio transcoding", status_code=500)
            except Exception as inner_exc:
                raise SarvamAPIError(f"Could not decode input audio: {inner_exc}", status_code=400)

    try:
        audio = audio.set_frame_rate(16000).set_channels(1).set_sample_width(2)
        out = io.BytesIO()
        audio.export(out, format="wav")
        return out.getvalue()
    except (FileNotFoundError, OSError):
        raise SarvamAPIError("ffmpeg is not installed or not on PATH — required for audio transcoding", status_code=500)
    except Exception as exc:
        raise SarvamAPIError(f"Could not export transcoded WAV audio: {exc}", status_code=400)


def _prepare_stt_upload(audio_bytes: bytes) -> tuple[bytes, str, str]:
    """Return (upload_bytes, mime_type, filename) for the given audio payload.

    Browser MediaRecorder produces WebM/Opus audio. Sarvam STT accepts WebM/Opus
    natively (auto-detecting the codec), so we pass it through unchanged with the
    correct MIME type — this removes the hard dependency on ffmpeg for voice input.
    WAV is passed through directly. Any other format only requires ffmpeg transcoding.
    """
    if audio_bytes.startswith(b"RIFF") and b"WAVE" in audio_bytes[:16]:
        return audio_bytes, "audio/wav", "audio.wav"
    if audio_bytes.startswith(b"\x1a\x45\xdf\xa3"):
        return audio_bytes, "audio/webm", "audio.webm"
    if not ensure_ffmpeg_on_path():
        raise SarvamAPIError(
            "Unsupported audio format and ffmpeg is not installed or not on PATH — required for audio transcoding",
            status_code=500,
        )
    wav_bytes = _transcode_to_wav(audio_bytes)
    return wav_bytes, "audio/wav", "audio.wav"


def clean_text_for_speech(raw_text: str) -> str:
    """Convert a formatted (Markdown) answer into naturally spoken text for TTS.

    The formatted display answer is never modified — this produces a separate,
    cleaned speech representation that reads naturally (no literal formatting
    symbols such as '**', '*', '#', backticks, bullets or raw URLs). The language
    and content of the underlying text are preserved (no translation performed).
    """
    if not raw_text or not raw_text.strip():
        return ""

    text = raw_text

    # 1. Drop fenced code blocks entirely, then inline code backticks.
    text = re.sub(r"```[\s\S]*?```", "", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = text.replace("`", "")

    # 2. Strip any HTML tags.
    text = re.sub(r"<[^>]*>", "", text)

    # 3. Markdown links: keep readable text, drop the URL.
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)

    # 4. Raw URLs become short readable labels.
    text = re.sub(r"\bhttps?://(?:www\.)?([^\s/)]+)", r"\1", text, flags=re.IGNORECASE)

    # 5. Headings (# .. -> label ending in a period).
    text = re.sub(r"^#{1,6}\s+(.*)$", r"\1.", text, flags=re.MULTILINE)

    # 6. Bold and italic spans (both * and _ delimiters).
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"__([^_]+)__", r"\1", text)
    text = re.sub(r"\*([^*\n]+)\*", r"\1", text)
    text = re.sub(r"_([^_\n]+)_", r"\1", text)

    # 7. Bullets / list markers become sentence boundaries.
    text = re.sub(r"(?:^|\n)\s*[•\-\*]\s+", ". ", text)
    text = re.sub(r"\s+•\s+", ". ", text)
    text = re.sub(r"(?:^|\n)\s*\d+[.)]\s+", ". ", text)

    # 8. "Label:" -> natural pause ("Label."). Supports Latin + all Indic scripts (\u0900-\u0D7F).
    text = re.sub(r"([A-Za-z0-9\u0900-\u0D7F][A-Za-z0-9\u0900-\u0D7F\s]*):", r"\1.", text)

    # 9. Remove remaining decorative markdown characters and stray backticks.
    text = re.sub(r"[\\#{}[\]()<>~^|=`*_]", " ", text)

    # 10. Collapse runs of punctuation/space and blank lines.
    text = re.sub(r"[ \t\r\n]+", " ", text)
    text = re.sub(r"\.\s*\.", ".", text)
    text = re.sub(r"\s*\.\s*", ". ", text)
    text = re.sub(r"\s*,\s*", ", ", text)
    text = text.strip()

    # 11. Ensure a natural sentence ending (Latin + Indic scripts).
    if text and not re.search(r"[.!?\u0964\u0965\u3002\uff01\uff1f]$", text):
        text += "."

    return text


class STTResult(NamedTuple):
    transcript: str
    language_code: str
    confidence: float = 1.0


class SarvamAPIError(Exception):
    """Typed exception raised on Sarvam API failures."""
    def __init__(self, message: str, status_code: int = 502, detail: str = ""):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.detail = detail


class CircuitBreaker:
    def __init__(self, failure_threshold: int = 3, cooldown_seconds: float = 30.0) -> None:
        self.failure_threshold = failure_threshold
        self.cooldown_seconds = cooldown_seconds
        self.failure_count = 0
        self.last_failure_time = 0.0
        self.state = "CLOSED"  # "CLOSED" or "OPEN"

    def can_attempt(self) -> bool:
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > self.cooldown_seconds:
                self.state = "HALF_OPEN"
                return True
            return False
        return True

    def record_success(self) -> None:
        self.failure_count = 0
        self.state = "CLOSED"

    def record_failure(self) -> None:
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = "OPEN"
            logger.warning("Sarvam Circuit breaker tripped to OPEN state for %s seconds", self.cooldown_seconds)


class SarvamVoiceService:
    def __init__(self) -> None:
        self.circuit_breaker = CircuitBreaker(failure_threshold=3, cooldown_seconds=30.0)
        self.languages_map = self._build_language_map()

    def _build_language_map(self) -> dict[str, str]:
        try:
            lang_data = load_languages()
            return {item["code"]: item["sarvam_code"] for item in lang_data.get("languages", [])}
        except Exception:
            return {
                "en": "en-IN",
                "hi": "hi-IN",
                "kn": "kn-IN",
                "te": "te-IN",
                "ta": "ta-IN",
                "ml": "ml-IN",
                "bn": "bn-IN",
                "mr": "mr-IN",
                "gu": "gu-IN",
            }

    def resolve_sarvam_lang(self, code: str | None) -> str:
        if not code:
            return "en-IN"
        code_clean = code.strip().lower()
        if code_clean in self.languages_map:
            return self.languages_map[code_clean]
        # Match prefix (e.g. "hi" -> "hi-IN")
        for k, v in self.languages_map.items():
            if code_clean.startswith(k):
                return v
        return "en-IN"

    async def speech_to_text(
        self,
        audio_bytes: bytes,
        language_code: str | None = None,
        sample_rate: int | None = None,
    ) -> STTResult:
        """Transcribe audio bytes to text using Sarvam AI STT API."""
        if not audio_bytes:
            raise SarvamAPIError("Audio input cannot be empty", status_code=400)

        current_settings = get_settings()
        api_key = current_settings.sarvam_api_key
        if not api_key:
            raise SarvamAPIError("SARVAM_API_KEY is not configured", status_code=503)

        if not self.circuit_breaker.can_attempt():
            raise SarvamAPIError("Sarvam STT service is temporarily unavailable (circuit open)", status_code=503)

        target_lang = self.resolve_sarvam_lang(language_code)

        # Determine the upload format/SIGNATURE. The browser records MediaRecorder
        # audio as WebM/Opus, which Sarvam STT supports natively (it auto-detects the
        # codec), so no ffmpeg transcoding is required for the common voice-input path.
        # Only fall back to ffmpeg transcoding for other/non-native formats.
        upload_bytes, upload_mime, upload_name = _prepare_stt_upload(audio_bytes)
        logger.info(
            "Sarvam STT request: language=%s resolved_lang=%s mime=%s audio_bytes=%d upload_bytes=%d",
            language_code, target_lang, upload_mime, len(audio_bytes), len(upload_bytes),
        )
        url = f"{current_settings.sarvam_api_base_url.rstrip('/')}/speech-to-text"
        headers = {"api-subscription-key": api_key}
        files = {"file": (upload_name, upload_bytes, upload_mime)}
        data = {"model": current_settings.sarvam_stt_model, "language_code": target_lang}

        max_retries = 3
        backoff = 0.5

        for attempt in range(1, max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    response = await client.post(url, headers=headers, files=files, data=data)
                    if response.status_code == 200:
                        res_json = response.json()
                        transcript = res_json.get("transcript", "").strip()
                        detected_lang = res_json.get("language_code", target_lang)
                        self.circuit_breaker.record_success()
                        return STTResult(transcript=transcript, language_code=detected_lang)
                    elif response.status_code == 400:
                        raise SarvamAPIError(f"Bad audio format or request: {response.text}", status_code=400)
                    elif response.status_code == 401 or response.status_code == 403:
                        raise SarvamAPIError("Invalid Sarvam API key or authentication failed", status_code=401)
                    else:
                        logger.warning("Sarvam STT attempt %d failed with status %d: %s", attempt, response.status_code, response.text)
            except SarvamAPIError:
                raise
            except (httpx.RequestError, httpx.TimeoutException) as exc:
                logger.warning("Sarvam STT attempt %d connection error: %s", attempt, exc)
            except Exception as exc:
                logger.warning("Sarvam STT attempt %d exception: %s", attempt, exc)

            if attempt < max_retries:
                await asyncio.sleep(backoff)
                backoff *= 2

        self.circuit_breaker.record_failure()
        raise SarvamAPIError("Sarvam STT service failed after retries", status_code=502)

    async def text_to_speech(
        self,
        text: str,
        language_code: str,
        voice: str | None = None,
        speed: float | None = None,
    ) -> bytes:
        """Convert text to speech audio bytes using Sarvam AI TTS API."""
        if not text or not text.strip():
            raise SarvamAPIError("Text input for TTS cannot be empty", status_code=400)

        current_settings = get_settings()
        api_key = current_settings.sarvam_api_key
        if not api_key:
            raise SarvamAPIError("SARVAM_API_KEY is not configured", status_code=503)

        if not self.circuit_breaker.can_attempt():
            raise SarvamAPIError("Sarvam TTS service is temporarily unavailable (circuit open)", status_code=503)

        target_lang = self.resolve_sarvam_lang(language_code)
        url = f"{current_settings.sarvam_api_base_url.rstrip('/')}/text-to-speech"
        headers = {
            "api-subscription-key": api_key,
            "Content-Type": "application/json",
        }

        # Clean Markdown/symbols for natural speech, then truncate to the TTS chunk limit.
        # The original formatted answer is left untouched for the UI.
        cleaned_text = clean_text_for_speech(text)
        if not cleaned_text:
            raise SarvamAPIError("Text input for TTS cannot be empty after cleaning", status_code=400)
        cleaned_text = cleaned_text[:500]
        tts_model = current_settings.sarvam_tts_model
        if tts_model == "bulbul:v2":
            tts_model = "bulbul:v3"

        payload = {
            "inputs": [cleaned_text],
            "target_language_code": target_lang,
            "speaker": voice or current_settings.sarvam_tts_voice,
            "pace": speed or 1.0,
            "speech_sample_rate": 8000,
            "enable_preprocessing": True,
            "model": tts_model,
        }

        max_retries = 3
        backoff = 0.5

        for attempt in range(1, max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    response = await client.post(url, headers=headers, json=payload)
                    if response.status_code == 200:
                        res_json = response.json()
                        audios = res_json.get("audios", [])
                        if audios and len(audios[0]) > 0:
                            self.circuit_breaker.record_success()
                            return base64.b64decode(audios[0])
                        raise SarvamAPIError("Sarvam TTS returned empty audio list", status_code=502)
                    elif response.status_code == 400:
                        raise SarvamAPIError(f"Invalid TTS request: {response.text}", status_code=400)
                    elif response.status_code in {401, 403}:
                        raise SarvamAPIError("Invalid Sarvam API key or authentication failed", status_code=401)
                    else:
                        logger.warning("Sarvam TTS attempt %d failed with status %d: %s", attempt, response.status_code, response.text)
            except SarvamAPIError:
                raise
            except (httpx.RequestError, httpx.TimeoutException) as exc:
                logger.warning("Sarvam TTS attempt %d connection error: %s", attempt, exc)
            except Exception as exc:
                logger.warning("Sarvam TTS attempt %d exception: %s", attempt, exc)

            if attempt < max_retries:
                await asyncio.sleep(backoff)
                backoff *= 2

        self.circuit_breaker.record_failure()
        raise SarvamAPIError("Sarvam TTS service failed after retries", status_code=502)


sarvam_service = SarvamVoiceService()
