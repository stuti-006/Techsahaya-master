import hashlib
import json
import logging
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.models.schemas import Scheme

logger = logging.getLogger("techsahaya.data_loader")

ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = ROOT / "data"
CACHE_DIR = DATA_DIR / ".cache"
CACHE_DIR.mkdir(exist_ok=True)


def _load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def _compute_file_hash(file_path: Path) -> str:
    """Compute SHA-256 hash of file for change detection."""
    sha256_hash = hashlib.sha256()
    with file_path.open("rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


def _load_dataset_hash(hash_file: Path) -> str | None:
    """Load stored dataset hash if it exists."""
    if hash_file.exists():
        try:
            with hash_file.open("r") as f:
                return f.read().strip()
        except Exception:
            return None
    return None


def _save_dataset_hash(hash_file: Path, hash_value: str) -> None:
    """Save dataset hash to file."""
    with hash_file.open("w") as f:
        f.write(hash_value)


@lru_cache
def load_schemes() -> list[Scheme]:
    schemes_file = DATA_DIR / "schemes" / "schemes.json"
    schemes = [Scheme(**item) for item in _load_json(schemes_file)]
    logger.info(f"[SCHEMES] Loaded {len(schemes)} schemes")
    return schemes


_scheme_cache: dict[str, Scheme] | None = None


def _build_scheme_cache() -> dict[str, Scheme]:
    """Build (once) an in-memory scheme cache keyed by scheme id."""
    global _scheme_cache
    if _scheme_cache is None:
        _scheme_cache = {s.id: s for s in load_schemes()}
    return _scheme_cache


def get_scheme_by_id(scheme_id: str) -> Scheme | None:
    """O(1) lookup of a complete scheme record by id using the in-memory cache."""
    return _build_scheme_cache().get(scheme_id)


def get_scheme_map() -> dict[str, Scheme]:
    """Get scheme map for O(1) lookups by ID."""
    return dict(_build_scheme_cache())


@lru_cache
def load_rules() -> dict[str, Any]:
    rules_dir = DATA_DIR / "rules"
    return {path.stem: _load_json(path) for path in rules_dir.glob("*.json")}


@lru_cache
def load_chunks() -> list[dict[str, Any]]:
    """
    Load or generate semantic chunks from schemes.
    Uses cached chunks if dataset hasn't changed, otherwise regenerates.
    """
    schemes_file = DATA_DIR / "schemes" / "schemes.json"
    hash_file = CACHE_DIR / "schemes_hash"
    cached_chunks_file = CACHE_DIR / "scheme_chunks_cached.json"
    
    # Compute current dataset hash
    current_hash = _compute_file_hash(schemes_file)
    stored_hash = _load_dataset_hash(hash_file)
    
    # Check if we can reuse cached chunks
    if stored_hash == current_hash and cached_chunks_file.exists():
        try:
            chunks = _load_json(cached_chunks_file)
            logger.info(f"[CHUNKS] Loaded {len(chunks)} chunks from cache (hash match)")
            return chunks
        except Exception as e:
            logger.warning(f"[CHUNKS] Failed to load cached chunks: {e}, regenerating...")
    
    # Need to regenerate chunks
    logger.info("[CHUNKS] Regenerating semantic chunks...")
    from app.services.scheme_chunker import create_semantic_chunks
    
    schemes = load_schemes()
    chunks = create_semantic_chunks(schemes)
    
    # Save chunks to cache and update hash
    with cached_chunks_file.open("w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)
    _save_dataset_hash(hash_file, current_hash)
    
    logger.info(f"[CHUNKS] Generated and cached {len(chunks)} chunks (hash: {current_hash[:8]}...)")
    return chunks


@lru_cache
def load_personas() -> dict[str, Any]:
    return _load_json(DATA_DIR / "personas" / "personas.json")


@lru_cache
def load_languages() -> dict[str, Any]:
    return _load_json(DATA_DIR / "config" / "languages.json")


@lru_cache
def load_tours() -> dict[str, Any]:
    return _load_json(DATA_DIR / "config" / "tours.json")


@lru_cache
def load_scheme_translations() -> dict[str, Any]:
    path = DATA_DIR / "config" / "scheme_translations.json"
    if path.exists():
        return _load_json(path)
    return {}


@lru_cache
def load_ocr_keywords() -> dict[str, Any]:
    path = DATA_DIR / "config" / "ocr_keywords.json"
    if path.exists():
        return _load_json(path)
    return {}


def validate_dataset_on_startup() -> bool:
    """
    Validate schemes dataset on application startup.
    Returns True if valid, False otherwise.
    """
    from app.services.scheme_validator import validate_schemes_dataset
    
    schemes_file = DATA_DIR / "schemes" / "schemes.json"
    result = validate_schemes_dataset(schemes_file)
    
    if not result["valid"]:
        logger.error("[VALIDATION] Dataset validation FAILED:")
        for error in result["errors"]:
            logger.error(f"  ✗ {error}")
        if result["warnings"]:
            for warning in result["warnings"]:
                logger.warning(f"  ⚠ {warning}")
        return False
    
    logger.info(f"[VALIDATION] Dataset validation PASSED: {result['stats']['total_schemes']} schemes, "
                f"{result['stats']['valid_schemes']} valid")
    return True

