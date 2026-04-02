from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

from apriori_model import build_rules
from hierarchical_model import build_hierarchy
from hybrid_model import final_recommend

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GLOBAL = {}

@app.post("/build")
async def build(
    transactions: UploadFile = File(...),
    items: UploadFile = File(...)
):

    df = pd.read_excel(transactions.file)
    item_df = pd.read_excel(items.file)

    rules = build_rules(df)
    hierarchy, item_lookup, item_stats = build_hierarchy(item_df)

    GLOBAL["rules"] = rules
    GLOBAL["hierarchy"] = hierarchy
    GLOBAL["item_lookup"] = item_lookup
    GLOBAL["item_stats"] = item_stats

    return {"message": "Models built successfully"}

@app.get("/recommend")
def recommend(item: str):

    if "rules" not in GLOBAL:
        return {"error": "Build models first"}

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
