from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


def _uuid() -> str:
    return str(uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    preferred_language: Mapped[str] = mapped_column(String(20), default="en")
    phone_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    auth_provider: Mapped[str] = mapped_column(String(50), default="local")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    description: Mapped[str] = mapped_column(String(255), default="")


class UserRole(Base):
    __tablename__ = "user_roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    role_name: Mapped[str] = mapped_column(String(50), ForeignKey("roles.name"), index=True)


class SessionRecord(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    remember_session: Mapped[bool] = mapped_column(Boolean, default=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class ProfileRecord(Base):
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), unique=True, index=True)
    preferred_language: Mapped[str] = mapped_column(String(20), default="en")
    accessibility_preference: Mapped[str] = mapped_column(String(50), default="standard")
    consent_given: Mapped[bool] = mapped_column(Boolean, default=False)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    occupation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    income: Mapped[float | None] = mapped_column(Float, nullable=True)
    landholding: Mapped[float | None] = mapped_column(Float, nullable=True)
    disability: Mapped[bool] = mapped_column(Boolean, default=False)
    family_members: Mapped[list] = mapped_column(JSON, default=list)
    available_documents: Mapped[list] = mapped_column(JSON, default=list)
    recently_viewed_schemes: Mapped[list] = mapped_column(JSON, default=list)
    digital_literacy: Mapped[str] = mapped_column(String(20), default="guided")
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ConsentRecord(Base):
    __tablename__ = "consents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    consent_version: Mapped[str] = mapped_column(String(20))
    selected_language: Mapped[str] = mapped_column(String(20), default="en")
    purpose: Mapped[str] = mapped_column(String(100))
    consent_given: Mapped[bool] = mapped_column(Boolean, default=True)
    granted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    withdrawn_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class DocumentRecord(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    document_type: Mapped[str] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(50), default="processed")
    verification_state: Mapped[str] = mapped_column(String(50), default="processed")
    masked_fields: Mapped[dict] = mapped_column(JSON, default=dict)
    file_name: Mapped[str] = mapped_column(String(255))
    mime_type: Mapped[str] = mapped_column(String(100))
    file_size: Mapped[int] = mapped_column(Integer)
    retained_in_storage: Mapped[bool] = mapped_column(Boolean, default=False)
    storage_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class JourneyRecord(Base):
    __tablename__ = "journeys"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    scheme_id: Mapped[str] = mapped_column(String(100), index=True)
    status: Mapped[str] = mapped_column(String(50), default="discovered")
    action: Mapped[str] = mapped_column(Text, default="")
    required_document: Mapped[str | None] = mapped_column(String(200), nullable=True)
    deadline: Mapped[str | None] = mapped_column(String(50), nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    actor_role: Mapped[str] = mapped_column(String(50), default="anonymous")
    event_type: Mapped[str] = mapped_column(String(100), index=True)
    target_resource: Mapped[str] = mapped_column(String(100), default="")
    detail: Mapped[str] = mapped_column(String(255), default="")
    request_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class NotificationRecord(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(120))
    message: Mapped[str] = mapped_column(String(255))
    level: Mapped[str] = mapped_column(String(30), default="info")
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AuthorizedSession(Base):
    __tablename__ = "authorized_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    citizen_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    operator_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    language: Mapped[str] = mapped_column(String(20), default="en")
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class SavedScheme(Base):
    __tablename__ = "saved_schemes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    scheme_id: Mapped[str] = mapped_column(String(100), index=True)


class SchemeCategoryRecord(Base):
    __tablename__ = "scheme_categories"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, default="")


class SchemeStateRecord(Base):
    __tablename__ = "scheme_states"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    code: Mapped[str | None] = mapped_column(String(20), nullable=True)


class SchemeRecord(Base):
    __tablename__ = "schemes"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str] = mapped_column(Text)
    category_id: Mapped[str | None] = mapped_column(String(100), ForeignKey("scheme_categories.id"), nullable=True)
    state_id: Mapped[str | None] = mapped_column(String(100), ForeignKey("scheme_states.id"), nullable=True)
    benefits: Mapped[list] = mapped_column(JSON, default=list)
    eligibility: Mapped[list] = mapped_column(JSON, default=list)
    application_steps: Mapped[list] = mapped_column(JSON, default=list)
    department: Mapped[str] = mapped_column(String(255), default="")
    status: Mapped[str] = mapped_column(String(50), default="active")
    alternative_scheme_ids: Mapped[list] = mapped_column(JSON, default=list)
    last_verified: Mapped[str] = mapped_column(String(50), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SchemeRuleRecord(Base):
    __tablename__ = "scheme_rules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    scheme_id: Mapped[str] = mapped_column(String(100), ForeignKey("schemes.id"), index=True)
    rule_json: Mapped[dict] = mapped_column(JSON, default=dict)
    version: Mapped[str] = mapped_column(String(50), default="v1")
    status: Mapped[str] = mapped_column(String(50), default="active")


class SchemeSourceRecord(Base):
    __tablename__ = "scheme_sources"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    scheme_id: Mapped[str] = mapped_column(String(100), ForeignKey("schemes.id"), index=True)
    source_name: Mapped[str] = mapped_column(String(255))
    source_url: Mapped[str] = mapped_column(String(500))
    source_reference: Mapped[str] = mapped_column(Text, default="")
    last_verified: Mapped[str] = mapped_column(String(50), default="")
    verification_status: Mapped[str] = mapped_column(String(50), default="needs_review")


class SchemeDocumentRecord(Base):
    __tablename__ = "scheme_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    scheme_id: Mapped[str] = mapped_column(String(100), ForeignKey("schemes.id"), index=True)
    document_name: Mapped[str] = mapped_column(String(255))
    required: Mapped[bool] = mapped_column(Boolean, default=True)
    purpose: Mapped[str] = mapped_column(String(255), default="")


class EmailOTPRecord(Base):
    __tablename__ = "email_otps"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(255), index=True)
    otp_code: Mapped[str] = mapped_column(String(10))
    purpose: Mapped[str] = mapped_column(String(50), default="signup_2fa")
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
