import numpy as np


def apply_menu_engineering(df):
    
    avg_qty = df["quantity"].mean()
    avg_revenue = df["revenue"].mean()
    

    conditions = [
        (df["quantity"] >= avg_qty) & (df["revenue"] >= avg_revenue),
        (df["quantity"] >= avg_qty) & (df["revenue"] < avg_revenue),
        (df["quantity"] < avg_qty) & (df["revenue"] >= avg_revenue),
    ]

    choices = ["STAR", "PLOWHORSE", "PUZZLE"]

    df["category"] = np.select(conditions, choices, default="DOG")

    return df