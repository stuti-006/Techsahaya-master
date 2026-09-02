import pytest
from app.services.document_service import document_service, _normalize_indic_digits, _get_field_keywords



def test_indic_digits_normalization():
    # Kannada digits ೩೪ -> 34, ೮೫೦೦೦ -> 85000
    assert _normalize_indic_digits("ವಯಸ್ಸು: ೩೪ / ಆದಾಯ: ೮೫೦೦೦") == "ವಯಸ್ಸು: 34 / ಆದಾಯ: 85000"
    # Devanagari digits ३४ -> 34, ८५००० -> 85000
    assert _normalize_indic_digits("आयु: ३४ / आय: ८५०००") == "आयु: 34 / आय: 85000"
    # Telugu digits ౩౪ -> 34
    assert _normalize_indic_digits("వయస్సు: ౩౪") == "వయస్సు: 34"
    # Bengali digits ৩৪ -> 34
    assert _normalize_indic_digits("বয়স: ৩৪") == "বয়স: 34"
    # Gujarati digits ૩૪ -> 34
    assert _normalize_indic_digits("ઉંમર: ૩૪") == "ઉંમર: 34"


def test_multilingual_field_extraction_all_9_languages():
    test_cases = [
        ("en", "Age: 34 / Annual Income: Rs 85,000 / Landholding: 2.5 acres", 34, 85000.0, 2.5),
        ("hi", "आयु: 34 वर्ष / वार्षिक आय: रु 85,000 / भूमि: 2.5 एकड़", 34, 85000.0, 2.5),
        ("kn", "ವಯಸ್ಸು: 34 / ವಾರ್ಷಿಕ ಆದಾಯ: ರೂ 85,000 / ಜಮೀನು: 2.5 ಎಕರೆ", 34, 85000.0, 2.5),
        ("te", "వయస్సు: 34 / వార్షిక ఆదాయం: రూ 85,000 / భూమి: 2.5 ఎకరాలు", 34, 85000.0, 2.5),
        ("ta", "வயது: 34 / ஆண்டு வருமானம்: ரூ 85,000 / நிலம்: 2.5 ஏக்கர்", 34, 85000.0, 2.5),
        ("ml", "വയസ്സ്: 34 / വാർഷിക വരുമാനം: 85,000 / ഭൂമി: 2.5 ഏക്കർ", 34, 85000.0, 2.5),
        ("bn", "বয়স: 34 / বার্ষিক আয়: 85,000 / জমি: 2.5 একর", 34, 85000.0, 2.5),
        ("mr", "वय: 34 / वार्षिक उत्पन्न: रु 85,000 / जमीन: 2.5 एकरी", 34, 85000.0, 2.5),
        ("gu", "ઉંમર: 34 / વાર્ષિક આવક: રૂ 85,000 / જમીન: 2.5 એકર", 34, 85000.0, 2.5),
    ]

    for lang, sample_text, expected_age, expected_income, expected_land in test_cases:
        extracted = document_service._parse_structured_fields(sample_text)
        assert extracted.get("age") == expected_age, f"Failed age extraction for language {lang}: {extracted}"
        assert extracted.get("income") == expected_income, f"Failed income extraction for language {lang}: {extracted}"
        assert extracted.get("landholding") == expected_land, f"Failed land extraction for language {lang}: {extracted}"


def test_dob_based_age_calculation_multilingual():
    # English DOB
    eng_res = document_service._parse_structured_fields("Date of Birth: 15/08/1990")
    assert eng_res.get("dob") == "15/08/1990"
    assert eng_res.get("age") is not None
    assert eng_res.get("age") > 0

    # Hindi DOB
    hin_res = document_service._parse_structured_fields("जन्म तिथि: 10/05/1995")
    assert hin_res.get("dob") == "10/05/1995"
    assert hin_res.get("age") is not None

    # Kannada DOB
    kan_res = document_service._parse_structured_fields("ಜನ್ಮ ದಿನಾಂಕ: 01/01/2000")
    assert kan_res.get("dob") == "01/01/2000"
    assert kan_res.get("age") is not None


def test_noise_and_currency_tolerance():
    text_with_noise = "CERTIFICATE DETAILS\nName: Ramesh Kumar\nವಯಸ್ಸು :   34 yrs\nTotal Family Income: INR 1,20,000/-\nExtent of Land: 3.75 acres"
    extracted = document_service._parse_structured_fields(_normalize_indic_digits(text_with_noise))
    assert extracted.get("age") == 34
    assert extracted.get("income") == 120000.0
    assert extracted.get("landholding") == 3.75


def test_no_third_party_vision_apis():
    # Verify zero imports or mentions of third-party OCR / Vision APIs in document_service.py
    import inspect
    source = inspect.getsource(document_service.__class__)
    forbidden = ["googleapis", "azure", "openai", "vision.googleapis", "aws.amazon", "sarvam_service.vision"]
    for token in forbidden:
        assert token not in source.lower(), f"Found forbidden third-party OCR reference: {token}"


def test_ocr_stray_digit_noise_before_real_value():
    # Verified real-world OCR case: Stray digit/token (e.g. item number or misread symbol) before the actual income value
    kannada_income_noise = "ಆದಾಯ (Income) 2 %85,000"
    extracted_inc = document_service._parse_structured_fields(kannada_income_noise, language="kn")
    assert extracted_inc.get("income") == 85000.0, f"Expected 85000.0, got {extracted_inc.get('income')}"

    # Stray invalid number (999 fails 0-125) and stray digit before age
    age_noise_1 = "1. Age : 999 34 yrs"
    extracted_age_1 = document_service._parse_structured_fields(age_noise_1, language="en")
    assert extracted_age_1.get("age") == 34, f"Expected 34, got {extracted_age_1.get('age')}"

    # Stray item digit in Kannada age line
    age_noise_2 = "ವಯಸ್ಸು : 2 34"
    extracted_age_2 = document_service._parse_structured_fields(age_noise_2, language="kn")
    assert extracted_age_2.get("age") == 34, f"Expected 34, got {extracted_age_2.get('age')}"

    # Stray item index before landholding
    land_noise = "3. Landholding: 1 2.5 acres"
    extracted_land = document_service._parse_structured_fields(land_noise, language="en")
    assert extracted_land.get("landholding") == 2.5, f"Expected 2.5, got {extracted_land.get('landholding')}"


def test_ocr_keyword_and_value_on_different_lines():
    # Verified real-world OCR case: OCR splits keyword and value across line breaks
    multiline_text = (
        "GOVERNMENT CERTIFICATE\n"
        "Name: Ramesh Kumar\n"
        "Age:\n"
        "34\n"
        "Annual Income:\n"
        "Rs 85,000\n"
        "Date of Birth:\n"
        "15/08/1990\n"
        "Landholding:\n"
        "2.5 acres\n"
    )
    extracted = document_service._parse_structured_fields(multiline_text, language="en")
    assert extracted.get("age") == 34
    assert extracted.get("income") == 85000.0
    assert extracted.get("dob") == "15/08/1990"
    assert extracted.get("landholding") == 2.5

    # Kannada multiline text
    kannada_multiline = (
        "ಕರ್ನಾಟಕ ಸರ್ಕಾರ\n"
        "ವಯಸ್ಸು:\n"
        "34\n"
        "ಆದಾಯ:\n"
        "85000\n"
    )
    kan_extracted = document_service._parse_structured_fields(_normalize_indic_digits(kannada_multiline), language="kn")
    assert kan_extracted.get("age") == 34
    assert kan_extracted.get("income") == 85000.0


def test_real_world_noisy_ocr_samples():
    # Realistic OCR sample with OCR artifacts (percentage signs, colons, tildes, item numbers)
    noisy_ocr = (
        "=== GOVT OF KARNATAKA ===\n"
        "No. 492849/2024\n"
        "Name: Ramesh Gowda\n"
        "ವಯಸ್ಸು (Age) : ~ 34 yrs\n"
        "ಕುಟುಂಬ ಆದಾಯ (Income) : 2 %85,000/-\n"
        "ಜಮೀನು (Land) : 2.5 ಎಕರೆ\n"
    )
    res = document_service._parse_structured_fields(_normalize_indic_digits(noisy_ocr), language="kn")
    assert res.get("age") == 34
    assert res.get("income") == 85000.0
    assert res.get("landholding") == 2.5
    assert res.get("field_confidences", {}).get("age") == "high"
    assert res.get("field_confidences", {}).get("income") == "high"


def test_degraded_skewed_creased_ocr_ranking_and_confidence():
    """
    Regression test for degraded/creased/skewed OCR input where:
    - Same line after keyword has stray isolated noise digits (e.g. 'Age: 4' or 'Income: 1580')
    - Subsequent line (shifted by skewed column layout) contains the real shaped value ('34' or '%85,000/-')
    - System MUST prefer the well-shaped, high-scoring candidate over the first stray match.
    """
    skewed_degraded_text = (
        "ಕರ್ನಾಟಕ ಸರ್ಕಾರ / GOVERNMENT OF KARNATAKA\n"
        "ಪ್ರಮಾಣ ಪತ್ರ ಸಂಖ್ಯೆ : IC/2025/9988\n"
        "ವಯಸ್ಸು (Age) : 4\n"
        "34\n"
        "ಆದಾಯ (Income) : 1580\n"
        "%85,000/-\n"
        "ಜಮೀನು (Land) : 0\n"
        "2.5 acres\n"
    )
    extracted = document_service._parse_structured_fields(
        _normalize_indic_digits(skewed_degraded_text), language="kn"
    )
    assert extracted.get("age") == 34, f"Expected age 34 (not noise 4), got {extracted.get('age')}"
    assert extracted.get("income") == 85000.0, f"Expected income 85000.0 (not noise 1580), got {extracted.get('income')}"
    assert extracted.get("landholding") == 2.5, f"Expected landholding 2.5 (not noise 0), got {extracted.get('landholding')}"
    assert extracted.get("field_confidences", {}).get("age") == "high"
    assert extracted.get("field_confidences", {}).get("income") == "high"


def test_language_specific_keyword_isolation():
    """
    Asserts that _get_field_keywords prioritizes the requested language
    and isolates language-specific variants (e.g. Kannada vs Tamil) while sharing standard English keywords.
    """
    kn_keywords = _get_field_keywords("age", "kn")
    ta_keywords = _get_field_keywords("age", "ta")
    hi_keywords = _get_field_keywords("age", "hi")

    # Kannada contains Kannada terms but not Tamil or Hindi terms
    assert "ವಯಸ್ಸು" in kn_keywords
    assert "வயது" not in kn_keywords
    assert "उम्र" not in kn_keywords

    # Tamil contains Tamil terms but not Kannada or Hindi terms
    assert "வயது" in ta_keywords
    assert "ವಯಸ್ಸು" not in ta_keywords
    assert "उम्र" not in ta_keywords

    # Hindi contains Hindi terms but not Kannada or Tamil terms
    assert "उम्र" in hi_keywords
    assert "ವಯಸ್ಸು" not in hi_keywords
    assert "வயது" not in hi_keywords

    # All share standard English keywords for bilingual document headers
    assert "age" in kn_keywords
    assert "age" in ta_keywords
    assert "age" in hi_keywords

    # Kannada and Tamil return different keyword lists
    assert kn_keywords != ta_keywords



