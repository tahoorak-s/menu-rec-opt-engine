from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os

from auth import create_access_token, verify_token

from apriori_model import build_rules
from hierarchical_model import build_hierarchy
from hybrid_model import final_recommend
from menu_eng import apply_menu_engineering
from database import Base, engine, SessionLocal
from models import User

Base.metadata.create_all(bind=engine)

app = FastAPI()

allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "*").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials="*" not in allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

GLOBAL = {}

USERS = {}

#authorization function
def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")

    token = authorization.split(" ")[1]
    payload = verify_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    return payload

#registration function
@app.post("/register")
async def register(username: str, password: str, role: str):

    if not username or not password or not role:
        raise HTTPException(status_code=400, detail="All fields required")

    if role not in ["admin", "waiter"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    db = SessionLocal()

    existing = db.query(User).filter(User.username == username).first()

    if existing:
        db.close()
        raise HTTPException(status_code=400, detail="User already exists")

    new_user = User(
        username=username,
        password=password,
        role=role,
        status="approved" if role == "admin" else "pending",
        admin_id=None
    )

    db.add(new_user)
    db.commit()
    db.close()

    return {"message": "User registered successfully"}
#login function
@app.post("/login")
async def login(username: str, password: str):

    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")

    db = SessionLocal()

    user = db.query(User).filter(User.username == username).first()

    if not user or user.password != password:
        db.close()
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user.role == "waiter" and user.status != "approved":
        db.close()
        raise HTTPException(status_code=403, detail="Waiter not approved yet")

    token = create_access_token({
        "sub": user.username,
        "role": user.role
    })

    db.close()

    return {
        "access_token": token,
        "role": user.role
    }

#view the pending waiters waiting to be approved. poor guys srsly what in the oligarchy is this
@app.get("/pending-waiters")
def get_pending_waiters(user=Depends(get_current_user)):

    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    db = SessionLocal()

    waiters = db.query(User).filter(
        User.role == "waiter",
        User.status == "pending"
    ).all()

    result = [w.username for w in waiters]

    db.close()

    return {"pending": result}

#ugh, admin, approve the waiters already. here, use this function
@app.post("/approve-waiter")
def approve_waiter(username: str, user=Depends(get_current_user)):

    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    db = SessionLocal()

    waiter = db.query(User).filter(User.username == username).first()

    if not waiter:
        db.close()
        raise HTTPException(status_code=404, detail="User not found")

    if waiter.role != "waiter":
        db.close()
        raise HTTPException(status_code=400, detail="Not a waiter")

    waiter.status = "approved"
    waiter.admin_id = user["sub"]

    db.commit()
    db.close()

    return {"message": "Waiter approved"}

#here we build the ML and MBA models which will be used for the recommendation engine
def read_model_files(transactions_file, items_file=None):
    transaction_sheets = pd.read_excel(transactions_file, sheet_name=None)

    if "Transactions" in transaction_sheets:
        df = transaction_sheets["Transactions"]
    else:
        df = next(iter(transaction_sheets.values()))

    if items_file is not None:
        item_sheets = pd.read_excel(items_file, sheet_name=None)
    else:
        item_sheets = transaction_sheets

    if "Aggregate_Menu" in item_sheets:
        item_df = item_sheets["Aggregate_Menu"]
    elif len(item_sheets) > 1:
        item_df = list(item_sheets.values())[1]
    else:
        item_df = next(iter(item_sheets.values()))

    return df, item_df


@app.post("/build")
async def build(
    transactions: UploadFile = File(...),
    items: UploadFile | None = File(None),
    user=Depends(get_current_user)
):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    df, item_df = read_model_files(transactions.file, items.file if items else None)

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

#recommendation engine
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
