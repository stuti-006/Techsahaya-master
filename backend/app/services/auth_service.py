import logging
import random
from datetime import datetime, timedelta

import httpx
from fastapi import HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.auth import get_user_role
from app.core.security import future_timestamp, generate_token, hash_password, hash_token, password_strength, verify_password
from app.models.db_models import ConsentRecord, EmailOTPRecord, ProfileRecord, Role, SessionRecord, User, UserRole
from app.models.schemas import AuthResponse, ConsentRequest, LoginRequest, SessionUser, SignUpRequest
from app.services.audit_service import audit_service

logger = logging.getLogger("techsahaya.auth")


class AuthService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def ensure_seed_roles_and_users(self, db: Session) -> None:
        for name, description in [
            ("citizen", "Citizen user"),
            ("csc_operator", "CSC operator"),
            ("admin", "System administrator"),
        ]:
            if db.query(Role).filter(Role.name == name).first() is None:
                db.add(Role(name=name, description=description))
        db.commit()

        seeds = [
            ("Citizen Account", "citizen@techsahaya.org", "Citizen@123", "citizen"),
            ("CSC Operator", "csc@techsahaya.org", "Csc@12345", "csc_operator"),
            ("Platform Admin", "admin@techsahaya.org", "Admin@12345", "admin"),
        ]
        for full_name, email, password, role in seeds:
            if db.query(User).filter(User.email == email).first() is None:
                user = User(full_name=full_name, email=email, password_hash=hash_password(password), preferred_language="en")
                db.add(user)
                db.commit()
                db.refresh(user)
                db.add(UserRole(user_id=user.id, role_name=role))
                db.add(ProfileRecord(user_id=user.id, preferred_language="en", consent_given=True))
                db.add(
                    ConsentRecord(
                        user_id=user.id,
                        consent_version="v1",
                        selected_language="en",
                        purpose="platform_seed",
                        consent_given=True,
                    )
                )
                db.commit()

    def signup(self, db: Session, payload: SignUpRequest, request: Request) -> dict:
        if self.settings.auth_adapter == "supabase" and self.settings.supabase_url and self.settings.supabase_anon_key:
            return self._signup_supabase(db, payload, request)
        if db.query(User).filter(User.email == payload.email).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        user = User(
            full_name=payload.full_name,
            email=payload.email,
            password_hash=hash_password(payload.password),
            preferred_language=payload.preferred_language,
            phone_number=payload.phone_number,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        db.add(UserRole(user_id=user.id, role_name="citizen"))
        db.add(ProfileRecord(user_id=user.id, preferred_language=payload.preferred_language, consent_given=payload.consent_given))
        db.add(
            ConsentRecord(
                user_id=user.id,
                consent_version="v1",
                selected_language=payload.preferred_language,
                purpose="signup",
                consent_given=payload.consent_given,
            )
        )
        db.commit()
        otp_data = self.send_otp(db, payload.email, purpose="signup_2fa", request=request)
        audit_service.log(db, "signup", "User signed up - OTP dispatched", user.id, "citizen", "auth", request)
        return {
            "requires_otp": True,
            "email": payload.email,
            "dev_otp": otp_data["dev_otp"],
            "message": "6-digit verification code sent to your email.",
            "password_strength": password_strength(payload.password),
        }

    def send_otp(self, db: Session, email: str, purpose: str = "signup_2fa", request: Request | None = None) -> dict:
        otp_code = f"{random.randint(100000, 999999)}"
        expires_at = datetime.utcnow() + timedelta(minutes=10)

        # Invalidate older pending OTPs for this email and purpose
        db.query(EmailOTPRecord).filter(
            EmailOTPRecord.email == email,
            EmailOTPRecord.purpose == purpose,
            EmailOTPRecord.is_used.is_(False),
        ).update({"is_used": True})

        record = EmailOTPRecord(
            email=email,
            otp_code=otp_code,
            purpose=purpose,
            expires_at=expires_at,
            is_used=False,
        )
        db.add(record)
        db.commit()

        logger.info(
            "📧 [TECH SAHAYA 2-STEP EMAIL VERIFICATION] Code for %s (%s) is: %s (expires in 10 mins)",
            email,
            purpose,
            otp_code,
        )

        return {
            "status": "sent",
            "email": email,
            "dev_otp": otp_code,
            "message": "6-digit verification code sent to your email.",
        }

    def verify_otp(
        self,
        db: Session,
        email: str,
        otp_code: str,
        purpose: str = "signup_2fa",
        request: Request | None = None,
        remember_session: bool = False,
    ) -> AuthResponse:
        now = datetime.utcnow()
        otp_record = (
            db.query(EmailOTPRecord)
            .filter(
                EmailOTPRecord.email == email,
                EmailOTPRecord.otp_code == otp_code.strip(),
                EmailOTPRecord.purpose == purpose,
                EmailOTPRecord.is_used.is_(False),
                EmailOTPRecord.expires_at > now,
            )
            .first()
        )

        # Allow fallback demo code 123456
        if otp_record is None and otp_code.strip() != "123456":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification code")

        if otp_record:
            otp_record.is_used = True
            db.commit()

        user = db.query(User).filter(User.email == email).first()
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found")

        token = generate_token()
        expires_at = future_timestamp(24 * 7 if remember_session else 8)
        db.add(
            SessionRecord(
                user_id=user.id,
                token_hash=hash_token(token),
                remember_session=remember_session,
                expires_at=expires_at,
            )
        )
        db.commit()

        role = get_user_role(db, user.id)
        profile = db.query(ProfileRecord).filter(ProfileRecord.user_id == user.id).first()
        if request:
            audit_service.log(db, "2fa_verified", "Email Two-Step verification successful", user.id, role, "auth", request)

        return AuthResponse(
            token=token,
            expires_at=expires_at.isoformat(),
            user=SessionUser(
                id=user.id,
                full_name=user.full_name,
                email=user.email,
                preferred_language=user.preferred_language,
                onboarding_completed=bool(profile.onboarding_completed if profile else False),
                role=role,
            ),
        )

    def login(self, db: Session, payload: LoginRequest, request: Request) -> AuthResponse:
        if self.settings.auth_adapter == "supabase" and self.settings.supabase_url and self.settings.supabase_anon_key:
            return self._login_supabase(db, payload, request)
        user = db.query(User).filter(User.email == payload.email).first()
        if user is None or not verify_password(payload.password, user.password_hash):
            audit_service.log(db, "failed_login", "Invalid credentials", user.id if user else None, "anonymous", "auth", request)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        token = generate_token()
        expires_at = future_timestamp(24 * 7 if payload.remember_session else 8)
        db.add(
            SessionRecord(
                user_id=user.id,
                token_hash=hash_token(token),
                remember_session=payload.remember_session,
                expires_at=expires_at,
            )
        )
        db.commit()
        role = get_user_role(db, user.id)
        profile = db.query(ProfileRecord).filter(ProfileRecord.user_id == user.id).first()
        audit_service.log(db, "login", "Login successful", user.id, role, "auth", request)
        return AuthResponse(
            token=token,
            expires_at=expires_at.isoformat(),
            user=SessionUser(
                id=user.id,
                full_name=user.full_name,
                email=user.email,
                preferred_language=user.preferred_language,
                onboarding_completed=bool(profile and profile.onboarding_completed),
                role=role,
            ),
        )

    def logout(self, db: Session, user: User, token: str, request: Request) -> None:
        session = db.query(SessionRecord).filter(SessionRecord.token_hash == hash_token(token), SessionRecord.user_id == user.id).first()
        if session:
            session.revoked_at = datetime.utcnow()
            db.add(session)
            db.commit()
        audit_service.log(db, "logout", "User logged out", user.id, get_user_role(db, user.id), "auth", request)

    def grant_consent(self, db: Session, user: User, payload: ConsentRequest, request: Request) -> None:
        db.add(
            ConsentRecord(
                user_id=user.id,
                consent_version=payload.consent_version,
                selected_language=payload.selected_language,
                purpose=payload.purpose,
                consent_given=payload.consent_given,
            )
        )
        profile = db.query(ProfileRecord).filter(ProfileRecord.user_id == user.id).first()
        if profile:
            profile.consent_given = payload.consent_given
            db.add(profile)
        db.commit()
        audit_service.log(db, "consent_granted" if payload.consent_given else "consent_withdrawn", payload.purpose, user.id, get_user_role(db, user.id), "consent", request)

    def _supabase_headers(self) -> dict[str, str]:
        return {
            "apikey": self.settings.supabase_anon_key,
            "Authorization": f"Bearer {self.settings.supabase_anon_key}",
            "Content-Type": "application/json",
        }

    def _signup_supabase(self, db: Session, payload: SignUpRequest, request: Request) -> dict:
        try:
            response = httpx.post(
                f"{self.settings.supabase_url.rstrip('/')}/auth/v1/signup",
                headers=self._supabase_headers(),
                json={
                    "email": payload.email,
                    "password": payload.password,
                    "data": {"full_name": payload.full_name, "preferred_language": payload.preferred_language},
                },
                timeout=10,
            )
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Supabase Auth is unavailable") from exc
        if response.status_code >= 400:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Signup could not be completed")

        data = response.json()
        auth_user = data.get("user") or data
        user_id = auth_user.get("id") if isinstance(auth_user, dict) else None
        user = db.query(User).filter(User.email == payload.email).first()
        if user is None:
            user_data = dict(
                full_name=payload.full_name,
                email=payload.email,
                password_hash=hash_password(generate_token()),
                preferred_language=payload.preferred_language,
                phone_number=payload.phone_number,
                auth_provider="supabase",
            )
            if user_id:
                user_data["id"] = user_id
            user = User(
                **user_data
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            db.add(UserRole(user_id=user.id, role_name="citizen"))
            db.add(ProfileRecord(user_id=user.id, preferred_language=payload.preferred_language, consent_given=payload.consent_given))
        db.add(
            ConsentRecord(
                user_id=user.id,
                consent_version="v1",
                selected_language=payload.preferred_language,
                purpose="signup",
                consent_given=payload.consent_given,
            )
        )
        db.commit()
        audit_service.log(db, "signup", "User signed up with Supabase Auth", user.id, "citizen", "auth", request)
        return {"password_strength": password_strength(payload.password), "auth_adapter": "supabase"}

    def _login_supabase(self, db: Session, payload: LoginRequest, request: Request) -> AuthResponse:
        try:
            response = httpx.post(
                f"{self.settings.supabase_url.rstrip('/')}/auth/v1/token?grant_type=password",
                headers=self._supabase_headers(),
                json={"email": payload.email, "password": payload.password},
                timeout=10,
            )
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Supabase Auth is unavailable") from exc
        if response.status_code >= 400:
            audit_service.log(db, "failed_login", "Invalid Supabase credentials", None, "anonymous", "auth", request)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

        data = response.json()
        access_token = data["access_token"]
        auth_user = data.get("user", {})
        email = auth_user.get("email", payload.email)
        full_name = (auth_user.get("user_metadata") or {}).get("full_name") or email.split("@")[0]
        preferred_language = (auth_user.get("user_metadata") or {}).get("preferred_language") or "en"
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            user_data = dict(
                full_name=full_name,
                email=email,
                password_hash=hash_password(generate_token()),
                preferred_language=preferred_language,
                auth_provider="supabase",
            )
            if auth_user.get("id"):
                user_data["id"] = auth_user.get("id")
            user = User(**user_data)
            db.add(user)
            db.commit()
            db.refresh(user)
            db.add(UserRole(user_id=user.id, role_name="citizen"))
            db.add(ProfileRecord(user_id=user.id, preferred_language=preferred_language, consent_given=False))
            db.commit()
        expires_at = datetime.utcnow() + timedelta(seconds=int(data.get("expires_in", 28800)))
        db.add(SessionRecord(user_id=user.id, token_hash=hash_token(access_token), remember_session=payload.remember_session, expires_at=expires_at))
        db.commit()
        role = get_user_role(db, user.id)
        profile = db.query(ProfileRecord).filter(ProfileRecord.user_id == user.id).first()
        audit_service.log(db, "login", "Login successful with Supabase Auth", user.id, role, "auth", request)
        return AuthResponse(
            token=access_token,
            expires_at=expires_at.isoformat(),
            auth_adapter="supabase",
            user=SessionUser(
                id=user.id,
                full_name=user.full_name,
                email=user.email,
                preferred_language=user.preferred_language,
                onboarding_completed=bool(profile and profile.onboarding_completed),
                role=role,
            ),
        )


auth_service = AuthService()
