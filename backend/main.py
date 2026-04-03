from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

from auth import create_access_token, verify_token

from apriori_model import build_rules
from hierarchical_model import build_hierarchy
from hybrid_model import final_recommend
from menu_eng import apply_menu_engineering

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GLOBAL = {}

# 🔥 NEW USER STRUCTURE
USERS = {
    "admin": {
        "password": "admin123",
        "role": "admin",
        "status": "approved",
        "admin_id": None
    }
}

# -----------------------------
# AUTH
# -----------------------------
def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")

    token = authorization.split(" ")[1]
    payload = verify_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    return payload

# -----------------------------
# REGISTER
# -----------------------------
@app.post("/register")
async def register(username: str, password: str, role: str):

    if not username or not password or not role:
        raise HTTPException(status_code=400, detail="All fields required")

    if role not in ["admin", "waiter"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    if username in USERS:
        raise HTTPException(status_code=400, detail="User already exists")

    # 🔥 KEY LOGIC
    USERS[username] = {
        "password": password,
        "role": role,
        "status": "approved" if role == "admin" else "pending",
        "admin_id": None
    }

    return {"message": "User registered successfully"}

# -----------------------------
# LOGIN
# -----------------------------
@app.post("/login")
async def login(username: str, password: str):

    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")

    user = USERS.get(username)

    if not user or user["password"] != password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 🔥 BLOCK UNAPPROVED WAITERS
    if user["role"] == "waiter" and user["status"] != "approved":
        raise HTTPException(status_code=403, detail="Waiter not approved yet")

    token = create_access_token({
        "sub": username,
        "role": user["role"]
    })

    return {
        "access_token": token,
        "role": user["role"]
    }

# -----------------------------
# ADMIN: VIEW PENDING WAITERS
# -----------------------------
@app.get("/pending-waiters")
def get_pending_waiters(user=Depends(get_current_user)):

    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    pending = [
        u for u, data in USERS.items()
        if data["role"] == "waiter" and data["status"] == "pending"
    ]

    return {"pending": pending}

# -----------------------------
# ADMIN: APPROVE WAITER
# -----------------------------
@app.post("/approve-waiter")
def approve_waiter(username: str, user=Depends(get_current_user)):

    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    if username not in USERS:
        raise HTTPException(status_code=404, detail="User not found")

    if USERS[username]["role"] != "waiter":
        raise HTTPException(status_code=400, detail="Not a waiter")

    USERS[username]["status"] = "approved"
    USERS[username]["admin_id"] = user["sub"]

    return {"message": f"{username} approved"}

# -----------------------------
# BUILD MODELS (ADMIN ONLY)
# -----------------------------
@app.post("/build")
async def build(
    transactions: UploadFile = File(...),
    items: UploadFile = File(...),
    user=Depends(get_current_user)
):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    df = pd.read_excel(transactions.file)
    item_df = pd.read_excel(items.file)

    item_df = apply_menu_engineering(item_df)

    categories = {
        "STAR": item_df[item_df["category"] == "STAR"]["item"].tolist(),
        "PLOWHORSE": item_df[item_df["category"] == "PLOWHORSE"]["item"].tolist(),
        "PUZZLE": item_df[item_df["category"] == "PUZZLE"]["item"].tolist(),
        "DOG": item_df[item_df["category"] == "DOG"]["item"].tolist(),
    }

    rules = build_rules(df)
    hierarchy, item_lookup, item_stats = build_hierarchy(item_df)

    GLOBAL["rules"] = rules
    GLOBAL["hierarchy"] = hierarchy
    GLOBAL["item_lookup"] = item_lookup
    GLOBAL["item_stats"] = item_stats

    return {
        "message": "Models built successfully",
        "categories": categories
    }

# -----------------------------
# RECOMMEND
# -----------------------------
@app.get("/recommend")
def recommend(item: str, user=Depends(get_current_user)):

    if "rules" not in GLOBAL:
        raise HTTPException(status_code=400, detail="Build models first")

    recs, reason = final_recommend(
        item,
        GLOBAL["rules"],
        GLOBAL["hierarchy"],
        GLOBAL["item_lookup"],
        GLOBAL["item_stats"]
    )

    return {
        "item": item,
        "recommendations": recs,
        "reason": reason
    }