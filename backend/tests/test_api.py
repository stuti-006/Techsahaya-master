from pathlib import Path
from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def setup_module():
    client.__enter__()


def teardown_module():
    client.__exit__(None, None, None)


def auth_headers(email: str = "citizen@techsahaya.org", password: str = "Citizen@123") -> dict[str, str]:
    response = client.post("/api/auth/login", json={"email": email, "password": password, "remember_session": False})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['token']}"}


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_signup_login_and_me():
    email = "new-citizen@example.com"
    signup = client.post(
        "/api/auth/signup",
        json={
            "full_name": "New Citizen",
            "email": email,
            "password": "Citizen@123",
            "preferred_language": "en",
            "phone_number": "9999999999",
            "consent_given": True,
        },
    )
    assert signup.status_code in {200, 400}
    login = client.post("/api/auth/login", json={"email": email, "password": "Citizen@123", "remember_session": False})
    assert login.status_code == 200
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {login.json()['token']}"})
    assert me.status_code == 200
    assert me.json()["role"] == "citizen"


def test_scheme_listing_is_public():
    response = client.get("/api/schemes")
    assert response.status_code == 200
    assert len(response.json()) >= 8


def test_scheme_details_is_public():
    response = client.get("/api/schemes/pm-kisan")
    assert response.status_code == 200
    assert response.json()["scheme"]["id"] == "pm-kisan"


def test_guest_chat_and_protected_endpoints():
    # Chat is accessible to guest users on landing page
    response = client.post("/api/chat", json={"message": "farmer schemes", "language": "en"})
    assert response.status_code == 200
    assert "answer" in response.json()

    # Documents endpoint strictly requires authentication
    doc_res = client.get("/api/documents")
    assert doc_res.status_code == 401


def test_email_otp_two_step_verification():
    email = "test_otp_user@techsahaya.org"
    # 1. Signup triggers OTP
    signup_res = client.post(
        "/api/auth/signup",
        json={
            "full_name": "OTP Test User",
            "email": email,
            "password": "Password@123",
            "preferred_language": "en",
            "consent_given": True,
        },
    )
    assert signup_res.status_code == 200
    data = signup_res.json()
    assert data["requires_otp"] is True
    dev_otp = data.get("dev_otp")
    assert dev_otp is not None

    # 2. Verify OTP logs user in and issues session token
    verify_res = client.post(
        "/api/auth/verify-otp",
        json={
            "email": email,
            "otp_code": dev_otp,
            "purpose": "signup_2fa",
        },
    )
    assert verify_res.status_code == 200
    auth_data = verify_res.json()
    assert "token" in auth_data
    assert auth_data["user"]["email"] == email


def test_eligibility():
    response = client.post(
        "/api/check-eligibility",
        headers=auth_headers(),
        json={
            "scheme_id": "pm-kisan",
            "profile": {
                "age": 45,
                "gender": "male",
                "state": "Karnataka",
                "occupation": "farmer",
                "income": 150000,
                "landholding": 1.5,
                "disability": False,
                "available_documents": ["land record"],
            },
        },
    )
    assert response.status_code == 200
    assert response.json()["status"] == "eligible"


def test_alternative_scheme():
    response = client.post(
        "/api/check-eligibility",
        headers=auth_headers(),
        json={
            "scheme_id": "pm-kisan",
            "profile": {
                "age": 17,
                "gender": "male",
                "state": "Karnataka",
                "occupation": "student",
                "income": 500000,
                "landholding": 0,
                "disability": False,
                "available_documents": [],
            },
        },
    )
    assert response.status_code == 200
    assert response.json()["alternative_schemes"]


def test_welfare_gaps():
    response = client.get("/api/welfare-gaps", headers=auth_headers())
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_family_analysis():
    response = client.post(
        "/api/family/analyze",
        headers=auth_headers(),
        json={
            "members": [
                {
                    "name": "Ravi",
                    "age": 45,
                    "gender": "male",
                    "occupation": "farmer",
                    "income": 150000,
                    "relationship": "self",
                    "state": "Karnataka",
                    "landholding": 1.2,
                    "available_documents": ["land record"],
                }
            ]
        },
    )
    assert response.status_code == 200
    assert "members" in response.json()


def test_what_if():
    response = client.post(
        "/api/what-if",
        headers=auth_headers(),
        json={
            "scheme_id": "pm-kisan",
            "current_profile": {
                "age": 45,
                "gender": "male",
                "state": "Karnataka",
                "occupation": "farmer",
                "income": 150000,
                "landholding": 1.2,
                "available_documents": ["land record"],
            },
            "simulated_changes": {"occupation": "student"},
        },
    )
    assert response.status_code == 200
    assert "changed_rules" in response.json()


def test_profile_crud_and_delete():
    headers = auth_headers()
    update = client.put(
        "/api/profile",
        headers=headers,
        json={"preferred_language": "kn", "consent_given": True, "age": 30, "state": "Karnataka"},
    )
    assert update.status_code == 200
    fetched = client.get("/api/profile", headers=headers)
    assert fetched.status_code == 200
    assert fetched.json()["preferred_language"] == "kn"
    deleted = client.delete("/api/profile", headers=headers)
    assert deleted.status_code == 200
    assert deleted.json()["status"] == "deleted"


def test_document_upload_rejects_aadhaar_or_pan_names():
    headers = auth_headers()
    response = client.post(
        "/api/documents/upload",
        headers=headers,
        files={"file": ("aadhaar-card.pdf", b"safe bytes", "application/pdf")},
    )
    assert response.status_code == 400
    assert "Aadhaar" in response.json()["detail"]


def test_document_upload_satisfies_nsp_document_rule():
    headers = auth_headers()
    upload = client.post(
        "/api/documents/upload",
        headers=headers,
        files={"file": ("income-certificate.pdf", b"safe bytes", "application/pdf")},
    )
    assert upload.status_code == 200
    assert upload.json()["document_type"] == "income_certificate"

    profile = {
        "age": 20,
        "gender": "female",
        "state": "Karnataka",
        "occupation": "student",
        "income": 200000,
        "landholding": 0,
        "disability": False,
        "available_documents": upload.json()["available_documents"],
    }
    result = client.post(
        "/api/check-eligibility",
        headers=headers,
        json={"scheme_id": "national-scholarship-portal", "profile": profile},
    )
    assert result.status_code == 200
    assert result.json()["status"] == "eligible"
    assert "document condition satisfied" in result.json()["matched"]


def test_admin_rbac():
    citizen = client.get("/api/admin/dashboard", headers=auth_headers())
    assert citizen.status_code == 403
    admin = client.get("/api/admin/dashboard", headers=auth_headers("admin@techsahaya.org", "Admin@12345"))
    assert admin.status_code == 200


def test_document_upload_ocr_quality_gate():
    headers = auth_headers()
    fixture_path = Path(__file__).parent / "fixtures" / "income_cert_decodesih.png"
    if fixture_path.exists():
        with fixture_path.open("rb") as f:
            content = f.read()
        res = client.post(
            "/api/documents/upload",
            headers=headers,
            files={"file": ("income_cert.png", content, "image/png")},
            data={"language": "kn"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["ocr_quality"] in ["good", "poor"]
        assert data["ocr_confidence_score"] is None or data["ocr_confidence_score"] >= 0.0

    degraded_path = Path(__file__).parent / "fixtures" / "degraded_skewed_creased_cert.png"
    if degraded_path.exists():
        with degraded_path.open("rb") as f:
            content = f.read()
        res = client.post(
            "/api/documents/upload",
            headers=headers,
            files={"file": ("degraded.png", content, "image/png")},
            data={"language": "kn"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["ocr_quality"] == "poor"
        assert "ಮರು-ಅಪ್‌ಲೋಡ್" in data["message"] or "ಸ್ಪಷ್ಟವಾದ" in data["message"]

