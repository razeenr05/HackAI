import os
import uuid
import json
import urllib.request
import urllib.error
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import bcrypt
import jwt

import models
from database import get_db

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

SECRET_KEY = os.getenv("JWT_SECRET", "changeme-use-a-real-secret-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

bearer_scheme = HTTPBearer(auto_error=False)

router = APIRouter(prefix="/auth", tags=["auth"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ""

class LoginRequest(BaseModel):
    email: str
    password: str

class GoogleAuthRequest(BaseModel):
    id_token: str   # Google credential from the frontend

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": user_id, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> str:
    """Returns user_id or raises HTTPException."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def verify_google_token(id_token: str) -> dict:
    """
    Verifies Google ID token using Google's tokeninfo endpoint.
    Returns the token payload (sub, email, name, picture).
    """
    url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
    try:
        with urllib.request.urlopen(url) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    # Verify the token was issued for our app
    if GOOGLE_CLIENT_ID and data.get("aud") != GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=401, detail="Google token audience mismatch")

    return data

def user_to_dict(user: models.User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name or "",
        "avatar_url": user.avatar_url or "",
    }


# ---------------------------------------------------------------------------
# Dependency — use in any protected endpoint
# ---------------------------------------------------------------------------

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = decode_token(credentials.credentials)
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        id=str(uuid.uuid4()),
        email=payload.email,
        name=payload.name or payload.email.split("@")[0],
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return AuthResponse(access_token=token, user=user_to_dict(user))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id)
    return AuthResponse(access_token=token, user=user_to_dict(user))


@router.post("/google", response_model=AuthResponse)
def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Receives the Google ID token from the frontend (after user clicks Sign in with Google),
    verifies it, and either creates a new user or logs in an existing one.
    """
    google_data = verify_google_token(payload.id_token)

    google_id = google_data.get("sub")
    email     = google_data.get("email")
    name      = google_data.get("name", "")
    picture   = google_data.get("picture", "")

    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    # Find by google_id first, then by email (handles pre-existing email accounts)
    user = db.query(models.User).filter(models.User.google_id == google_id).first()
    if not user:
        user = db.query(models.User).filter(models.User.email == email).first()

    if user:
        # Update google_id + avatar in case they hadn't linked Google before
        user.google_id = google_id
        user.avatar_url = picture
        db.commit()
    else:
        # Brand new user via Google
        user = models.User(
            id=str(uuid.uuid4()),
            email=email,
            name=name,
            avatar_url=picture,
            google_id=google_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(user.id)
    return AuthResponse(access_token=token, user=user_to_dict(user))


@router.get("/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return user_to_dict(current_user)