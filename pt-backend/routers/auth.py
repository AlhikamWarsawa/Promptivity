import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from database import get_db_conn
from services.auth_service import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter()

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
async def register(req: RegisterRequest):
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password min 6 chars")
        
    with get_db_conn() as conn:
        cursor = conn.cursor()
        
        # Check duplicate
        cursor.execute("SELECT id FROM users WHERE email = ?", (req.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")
            
        user_id = str(uuid.uuid4())
        pwd_hash = hash_password(req.password)
        
        cursor.execute(
            "INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)",
            (user_id, req.name, req.email, pwd_hash)
        )
        conn.commit()
        
    return {"success": True}

@router.post("/login")
async def login(req: LoginRequest):
    with get_db_conn() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, email, password_hash FROM users WHERE email = ?", (req.email,))
        user = cursor.fetchone()
        
        if not user or not verify_password(req.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
        token = create_access_token(data={"sub": user["id"]})
        
        return {
            "token": token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"]
            }
        }

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user
