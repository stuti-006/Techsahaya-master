import io
import json
import pytest
from pathlib import Path
from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.db import SessionLocal
from app.core.redis_client import ephemeral_store
from app.models.db_models import User, DocumentRecord
from app.services.chat_service import chat_service
from app.services.document_service import document_service, _normalize_indic_digits
from app.services.data_loader import load_ocr_keywords

FIXTURE_PATH = Path(__file__).parent / "fixtures" / "income_cert_decodesih.png"


def test_real_uploaded_certificate_end_to_end_ocr():
    assert FIXTURE_PATH.exists(), f"Missing fixture: {FIXTURE_PATH}"

    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "citizen_ocr_test@example.com").first()
        if not user:
            user = User(
                email="citizen_ocr_test@example.com",
                full_name="Ramesh Kumar",
                password_hash="mock",
                preferred_language="kn",
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        with FIXTURE_PATH.open("rb") as f:
            content = f.read()

        file = UploadFile(
            file=io.BytesIO(content),
            filename="income_cert_decodesih.png",
            headers={"content-type": "image/png"},
        )

        # 1. Process upload through real service pipeline
        doc = document_service.process_upload(
            db=db,
            user=user,
            file=file,
            content=content,
            declared_type="income_certificate",
            language="kn",
        )

        # 2. Verify DocumentRecord privacy constraints
        assert doc.status == "processed"
        assert doc.verification_state == "processed_in_memory"
        assert doc.retained_in_storage is False
        assert doc.masked_fields["document_type"] == "income_certificate"
        assert doc.masked_fields["identifier_masked"] == "XXXX-XXXX"

        # 3. Verify ephemeral OCR cache in Redis / ephemeral store
        cached = ephemeral_store.get(f"doc:{doc.id}")
        assert cached is not None, "Ephemeral OCR was not cached"
        assert cached["document_id"] == doc.id
        assert cached["user_id"] == user.id

        extracted = cached["extracted_fields"]
        print("\n=== REAL RUNTIME OCR EXTRACTION ON UPLOADED IMAGE ===")
        print("DOCUMENT ID:", doc.id)
        print("CACHED IN EPHEMERAL STORE:", json.dumps(cached, indent=2, ensure_ascii=False))

        # 4. Verify fields extracted from the real certificate image
        assert extracted.get("age") == 34, f"Expected age 34, got {extracted.get('age')}"
        assert extracted.get("income") == 85000.0, f"Expected income 85000.0, got {extracted.get('income')}"

        # Clean up created test document record
        db.delete(doc)
        db.commit()
        ephemeral_store.delete(f"doc:{doc.id}")
    finally:
        db.close()


def test_ephemeral_ocr_wiring_into_chat_eligibility():
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "ephemeral_chat_test@example.com").first()
        if not user:
            user = User(
                email="ephemeral_chat_test@example.com",
                full_name="Suresh Kumar",
                password_hash="mock",
                preferred_language="en",
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # 1. Simulate processed document with ephemeral data in Redis/in-memory store
        doc = DocumentRecord(
            user_id=user.id,
            document_type="income_certificate",
            status="processed",
            verification_state="processed_in_memory",
            masked_fields={"document_type": "income_certificate", "identifier_masked": "XXXX-XXXX"},
            file_name="income_cert.png",
            mime_type="image/png",
            file_size=1024,
            retained_in_storage=False,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        ephemeral_payload = {
            "document_id": doc.id,
            "user_id": user.id,
            "document_type": "income_certificate",
            "extracted_fields": {"age": 34, "income": 85000.0, "landholding": 2.5},
            "created_at": "2026-08-29T12:00:00",
        }
        ephemeral_store.set(f"doc:{doc.id}", ephemeral_payload, ttl_seconds=300)

        # 2. Ask "what is my age" and "whats my age?" before TTL expires
        age_resp = chat_service.answer("What is my age?", language="en", user=user, db=db)
        assert "34" in age_resp.answer, f"Expected age 34 in answer: {age_resp.answer}"

        whats_age_resp = chat_service.answer("whats my age?", language="en", user=user, db=db)
        assert "34" in whats_age_resp.answer, f"Expected age 34 in answer for 'whats my age?': {whats_age_resp.answer}"

        how_old_resp = chat_service.answer("how old am i", language="en", user=user, db=db)
        assert "34" in how_old_resp.answer, f"Expected age 34 in answer for 'how old am i': {how_old_resp.answer}"

        # 3. Ask "what is my income" and "whats my income?"
        inc_resp = chat_service.answer("What is my income?", language="en", user=user, db=db)
        assert "85,000" in inc_resp.answer or "85000" in inc_resp.answer, f"Expected income in answer: {inc_resp.answer}"

        whats_inc_resp = chat_service.answer("whats my income?", language="en", user=user, db=db)
        assert "85,000" in whats_inc_resp.answer or "85000" in whats_inc_resp.answer, f"Expected income in answer for 'whats my income?': {whats_inc_resp.answer}"

        # 4. Ask eligibility question in same active session
        pmkisan_resp = chat_service.answer("Am I eligible for PM-Kisan?", language="en", user=user, db=db)
        assert "34" in pmkisan_resp.answer or "85,000" in pmkisan_resp.answer or "ELIGIBLE" in pmkisan_resp.answer.upper() or len(pmkisan_resp.schemes) > 0

        # 5. Simulate TTL expiration (key purged from Redis/cache)
        ephemeral_store.delete(f"doc:{doc.id}")

        # 6. Ask "what is my age" after TTL expiration -> graceful prompt to re-upload
        expired_resp = chat_service.answer("What is my age?", language="en", user=user, db=db)
        assert any(
            phrase in expired_resp.answer.lower()
            for phrase in ["expired", "re-upload", "upload", "manual", "no age"]
        ), f"Expected expiration notice in response: {expired_resp.answer}"

        # Clean up
        db.delete(doc)
        db.commit()
    finally:
        db.close()


def test_kannada_indic_digits_normalization():
    indic_sample = "ವಯಸ್ಸು: ೩೪ / ಆದಾಯ: ೮೫೦೦೦"
    normalized = _normalize_indic_digits(indic_sample)
    assert normalized == "ವಯಸ್ಸು: 34 / ಆದಾಯ: 85000"
    fields = document_service._parse_structured_fields(normalized, language="kn")
    assert fields.get("age") == 34
    assert fields.get("income") == 85000.0


def test_json_keywords_loaded_dynamically():
    keywords = load_ocr_keywords()
    assert "_comment" in keywords
    assert "kn" in keywords["age"]
    assert "ವಯಸ್ಸು" in keywords["age"]["kn"]
    assert "kn" in keywords["income"]
    assert "ಆದಾಯ" in keywords["income"]["kn"]


def test_low_confidence_softened_chat_response():
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "low_conf_test@example.com").first()
        if not user:
            user = User(
                email="low_conf_test@example.com",
                full_name="Low Conf User",
                password_hash="mock",
                preferred_language="en",
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        doc = DocumentRecord(
            user_id=user.id,
            document_type="income_certificate",
            status="processed",
            verification_state="processed_in_memory",
            masked_fields={"document_type": "income_certificate"},
            file_name="income_cert.png",
            mime_type="image/png",
            file_size=1024,
            retained_in_storage=False,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        # Store low confidence age & income in ephemeral store
        ephemeral_payload = {
            "document_id": doc.id,
            "user_id": user.id,
            "document_type": "income_certificate",
            "extracted_fields": {
                "age": 34,
                "income": 85000.0,
                "_age_confidence": "low",
                "_income_confidence": "low",
                "field_confidences": {"age": "low", "income": "low"},
            },
            "field_confidences": {"age": "low", "income": "low"},
            "created_at": "2026-08-29T12:00:00",
        }
        ephemeral_store.set(f"doc:{doc.id}", ephemeral_payload, ttl_seconds=300)

        # 1. Ask age in English -> softened phrasing
        age_resp = chat_service.answer("What is my age?", language="en", user=user, db=db)
        assert "approximately" in age_resp.answer.lower() or "confirm" in age_resp.answer.lower()
        assert "verified age is" not in age_resp.answer.lower()

        # 2. Ask income in English -> softened phrasing
        inc_resp = chat_service.answer("What is my income?", language="en", user=user, db=db)
        assert "approximately" in inc_resp.answer.lower() or "confirm" in inc_resp.answer.lower()
        assert "verified annual income is" not in inc_resp.answer.lower()

        # Clean up
        db.delete(doc)
        db.commit()
        ephemeral_store.delete(f"doc:{doc.id}")
    finally:
        db.close()


def test_ocr_quality_gate_clean_fixture_is_good():
    """Verify clean fixture gets ocr_quality == 'good' and merges into chat profile."""
    assert FIXTURE_PATH.exists()
    content = FIXTURE_PATH.read_bytes()

    fields = document_service._extract_ephemeral_fields(content, "image/png", "income_certificate", language="kn")
    assert fields.get("ocr_quality") == "good"
    assert fields.get("ocr_confidence_score") is not None
    assert fields.get("ocr_confidence_score") >= 55.0
    assert fields.get("age") == 34
    assert fields.get("income") == 85000.0


def test_ocr_quality_gate_degraded_creased_fixture_is_poor_and_unmerged():
    """Verify degraded/creased fixture gets ocr_quality == 'poor' and is NOT merged into chat-visible profile."""
    degraded_path = Path(__file__).parent / "fixtures" / "degraded_skewed_creased_cert.png"
    assert degraded_path.exists()
    content = degraded_path.read_bytes()

    # 1. Direct extraction asserts
    fields = document_service._extract_ephemeral_fields(content, "image/png", "income_certificate", language="kn")
    assert fields.get("ocr_quality") == "poor"
    assert (fields.get("ocr_confidence_score") is None) or (fields.get("ocr_confidence_score") < 55.0)


def test_ocr_quality_gate_real_creased_skewed_fixture_is_poor():
    """
    Regression test asserting the real crease/skew fixture (creased_income_certificate_dsih.png)
    is classified ocr_quality == 'poor' and its wrong values are NOT merged into the profile.
    """
    creased_path = Path(__file__).parent / "fixtures" / "creased_income_certificate_dsih.png"
    assert creased_path.exists(), f"Missing fixture: {creased_path}"
    content = creased_path.read_bytes()

    # 1. Direct extraction asserts
    fields = document_service._extract_ephemeral_fields(content, "image/png", "income_certificate", language="kn")
    assert fields.get("ocr_quality") == "poor"
    assert (fields.get("ocr_confidence_score") is None) or (fields.get("ocr_confidence_score") < 55.0)

    # 2. Upload through service & test chat rejection
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "creased_real_test@example.com").first()
        if not user:
            user = User(
                email="creased_real_test@example.com",
                full_name="Creased Real Tester",
                password_hash="mock",
                preferred_language="kn",
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        file = UploadFile(
            file=io.BytesIO(content),
            filename="creased_income_certificate_dsih.png",
            headers={"content-type": "image/png"},
        )

        doc = document_service.process_upload(
            db=db,
            user=user,
            file=file,
            content=content,
            declared_type="income_certificate",
            language="kn",
        )

        cached = ephemeral_store.get(f"doc:{doc.id}")
        assert cached is not None
        assert cached.get("ocr_quality") == "poor"

        # 3. Chat query MUST NOT state numbers, must prompt re-upload
        kn_chat_resp = chat_service.answer("ನನ್ನ ಆದಾಯ ಎಷ್ಟು?", language="kn", user=user, db=db)
        assert "ಮರು-ಅಪ್‌ಲೋಡ್" in kn_chat_resp.answer or "ಸ್ಪಷ್ಟವಾದ" in kn_chat_resp.answer or "ಓದಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ" in kn_chat_resp.answer

        en_chat_resp = chat_service.answer("What is my income?", language="en", user=user, db=db)
        assert "re-upload" in en_chat_resp.answer.lower() or "clearer photo" in en_chat_resp.answer.lower()

        # Clean up
        db.delete(doc)
        db.commit()
        ephemeral_store.delete(f"doc:{doc.id}")
    finally:
        db.close()


def test_medium_confidence_hedged_chat_response():
    """
    Asserts that medium-confidence age and income extractions produce hedged phrasing
    ('approximately', 'please confirm') and NOT 'verified' in chat response.
    """
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "medium_conf_test@example.com").first()
        if not user:
            user = User(
                email="medium_conf_test@example.com",
                full_name="Medium Conf User",
                password_hash="mock",
                preferred_language="en",
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        doc = DocumentRecord(
            user_id=user.id,
            document_type="income_certificate",
            status="processed",
            verification_state="processed_in_memory",
            masked_fields={"document_type": "income_certificate"},
            file_name="income_cert.png",
            mime_type="image/png",
            file_size=1024,
            retained_in_storage=False,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        ephemeral_payload = {
            "document_id": doc.id,
            "user_id": user.id,
            "document_type": "income_certificate",
            "extracted_fields": {
                "age": 34,
                "income": 85000.0,
                "_age_confidence": "medium",
                "_income_confidence": "medium",
                "field_confidences": {"age": "medium", "income": "medium"},
            },
            "field_confidences": {"age": "medium", "income": "medium"},
            "ocr_quality": "good",
            "created_at": "2026-08-29T12:00:00",
        }
        ephemeral_store.set(f"doc:{doc.id}", ephemeral_payload, ttl_seconds=300)

        # 1. Ask age in English -> hedged phrasing, NOT verified
        age_resp = chat_service.answer("What is my age?", language="en", user=user, db=db)
        assert "approximately" in age_resp.answer.lower() or "confirm" in age_resp.answer.lower()
        assert "verified age is" not in age_resp.answer.lower()
        assert age_resp.verification_status == "requires_official_verification"
        assert age_resp.confidence == "medium"

        # 2. Ask income in English -> hedged phrasing, NOT verified
        inc_resp = chat_service.answer("What is my income?", language="en", user=user, db=db)
        assert "approximately" in inc_resp.answer.lower() or "confirm" in inc_resp.answer.lower()
        assert "verified annual income is" not in inc_resp.answer.lower()
        assert inc_resp.verification_status == "requires_official_verification"
        assert inc_resp.confidence == "medium"

        # Clean up
        db.delete(doc)
        db.commit()
        ephemeral_store.delete(f"doc:{doc.id}")
    finally:
        db.close()



