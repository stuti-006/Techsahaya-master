import re

CURRENCY_WORDS = {
    "en": "rupees",
    "hi": "रुपये",
    "kn": "ರೂಪಾಯಿ",
    "te": "రూపాయలు",
    "ta": "ரூபாய்",
    "ml": "രൂപ",
    "bn": "টাকা",
    "mr": "रुपये",
    "gu": "રૂપિયા",
}


def normalize_for_speech(text: str, language_code: str = "en") -> str:
    """
    Normalizes text for text-to-speech engines (Sarvam TTS):
    1. Replaces currency prefix symbols/words (₹, Rs., INR, etc.) followed by numbers
       with '{clean_number} {currency_word}' (number first, unit after) so TTS
       reads the full amount naturally without pausing on symbols or reading out of order.
    2. Strips commas from Indian (lakh/crore) and international comma-grouped numbers
       (e.g., 85,000 -> 85000, 1,20,000 -> 120000) so TTS does not treat commas as pauses.
    3. Leaves all general prose, punctuation, and wording in all 9 languages intact.
    """
    if not text:
        return ""

    lang_prefix = (language_code or "en")[:2].lower()
    currency_word = CURRENCY_WORDS.get(lang_prefix, "rupees")

    # Pattern for currency prefixes before digits (with optional commas and decimals)
    # Matches: ₹85,000 | ₹ 1,20,000 | Rs. 85,000 | Rs 85000 | INR 50000 | ರೂ 85,000 | ರೂ. 85,000 | रू 85,000
    currency_pattern = re.compile(
        r"(?:₹|Rs\.?|INR|ರೂ\.?|रू\.?)\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?|\d+(?:\.\d+)?)",
        re.IGNORECASE,
    )

    def _replace_currency(match: re.Match) -> str:
        raw_number = match.group(1)
        clean_number = raw_number.replace(",", "")
        return f"{clean_number} {currency_word}"

    normalized = currency_pattern.sub(_replace_currency, text)

    # Pattern for standalone comma-separated numbers (without currency symbol)
    # Matches Indian lakh/crore grouping e.g. 1,20,000 or standard 85,000
    standalone_number_pattern = re.compile(
        r"\b(\d{1,3}(?:,\d{2,3})+(?:\.\d+)?)\b"
    )

    def _replace_standalone_number(match: re.Match) -> str:
        return match.group(1).replace(",", "")

    normalized = standalone_number_pattern.sub(_replace_standalone_number, normalized)

    return normalized
