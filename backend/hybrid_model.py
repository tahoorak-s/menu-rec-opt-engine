from apriori_model import recommend_mba
from hierarchical_model import recommend_hierarchical

def final_recommend(item, rules, hierarchy, item_lookup, item_stats):

    # 1️⃣ MBA
    mba = recommend_mba(item, rules)

    if mba:
        return mba, "Based on customer purchase patterns"

    # 2️⃣ Hierarchical
    hier = recommend_hierarchical(item, hierarchy, item_lookup)

    if hier:
        return hier, "Based on menu optimization strategy"

    # 3️⃣ Fallback
    fallback = item_stats.sort_values(
        by="Qty_Sold", ascending=False
    )["Item_Name"].tolist()

    return fallback[:5], "Based on popularity"